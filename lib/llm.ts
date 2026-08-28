import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import {
  MAX_OUTPUT_TOKENS,
  PERSONA_ABORT_MS,
  PERSONA_RETRY_BUDGET_MS,
} from "@/config/limits";
import type { Persona } from "@/config/personas";
import { extractJsonObject, humanizeModelError, textFromUnknownError } from "@/lib/json";
import { callOptions, structuredAbortMs } from "@/lib/llm-options";
import { jsonOnlySuffix } from "@/lib/prompt";
import {
  TurnLlmSchema,
  TurnRound2LlmSchema,
  parseTurnPayload,
  type TurnPayload,
} from "@/lib/schema";

function modelFor(p: Persona) {
  if (p.provider === "anthropic") return anthropic(p.modelId);
  if (p.provider === "openai") return openai(p.modelId);
  return google(p.modelId);
}

export type PersonaCallResult =
  | {
      status: "ok";
      payload: TurnPayload;
      latencyMs: number;
      usage: { input: number; output: number };
      model: string;
      provider: Persona["provider"];
    }
  | {
      status: "failed";
      error: string;
      latencyMs: number;
      model: string;
      provider: Persona["provider"];
    };

type OnceOk = {
  output: TurnPayload;
  latencyMs: number;
  usage: { input: number; output: number };
};

function usageOf(usage: { inputTokens?: number; outputTokens?: number } | undefined) {
  return {
    input: usage?.inputTokens ?? 0,
    output: usage?.outputTokens ?? 0,
  };
}

async function once(
  p: Persona,
  system: string,
  user: string,
  temperature: number,
  round: 1 | 2,
  abortMs: number,
): Promise<OnceOk> {
  const t0 = Date.now();
  const options = callOptions(p, temperature);
  const llmSchema = round === 2 ? TurnRound2LlmSchema : TurnLlmSchema;
  try {
    const { output, usage } = await generateText({
      model: modelFor(p),
      system,
      prompt: user,
      output: Output.object({ schema: llmSchema, name: "turn" }),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: AbortSignal.timeout(structuredAbortMs(abortMs)),
      ...options,
    });
    return {
      output: parseTurnPayload(output, round),
      latencyMs: Date.now() - t0,
      usage: usageOf(usage),
    };
  } catch (err) {
    const recovered = textFromUnknownError(err);
    if (recovered) {
      try {
        const parsed = parseTurnPayload(extractJsonObject(recovered), round);
        return {
          output: parsed,
          latencyMs: Date.now() - t0,
          usage: { input: 0, output: 0 },
        };
      } catch {
        /* fall through to a text JSON retry */
      }
    }
    const remaining = abortMs - (Date.now() - t0);
    if (remaining < 2_000) throw err;
    const { text, usage } = await generateText({
      model: modelFor(p),
      system: `${system}\n${jsonOnlySuffix(round)}`,
      prompt: user,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: AbortSignal.timeout(remaining),
      ...options,
    });
    const parsed = parseTurnPayload(extractJsonObject(text), round);
    return {
      output: parsed,
      latencyMs: Date.now() - t0,
      usage: usageOf(usage),
    };
  }
}

export async function callPersona(
  p: Persona,
  system: string,
  user: string,
  round: 1 | 2,
): Promise<PersonaCallResult> {
  const budgetStart = Date.now();
  try {
    const first = await once(p, system, user, p.temperature, round, PERSONA_ABORT_MS);
    return {
      status: "ok",
      payload: first.output,
      latencyMs: first.latencyMs,
      usage: first.usage,
      model: p.modelId,
      provider: p.provider,
    };
  } catch (err) {
    const remaining = PERSONA_RETRY_BUDGET_MS - (Date.now() - budgetStart);
    if (remaining < 3_000) {
      return {
        status: "failed",
        error: humanizeModelError(
          err instanceof Error ? err.message : "call failed",
        ),
        latencyMs: Date.now() - budgetStart,
        model: p.modelId,
        provider: p.provider,
      };
    }
    try {
      const retryAbort = Math.min(PERSONA_ABORT_MS, remaining);
      const second = await once(p, system, user, 0.2, round, retryAbort);
      return {
        status: "ok",
        payload: second.output,
        latencyMs: Date.now() - budgetStart,
        usage: second.usage,
        model: p.modelId,
        provider: p.provider,
      };
    } catch (err2) {
      return {
        status: "failed",
        error: humanizeModelError(
          err2 instanceof Error ? err2.message : "retry failed",
        ),
        latencyMs: Date.now() - budgetStart,
        model: p.modelId,
        provider: p.provider,
      };
    }
  }
}
