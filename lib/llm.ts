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
import { extractJsonObject, humanizeModelError } from "@/lib/json";
import { TurnRound2Schema, TurnSchema, type TurnPayload } from "@/lib/schema";

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

async function once(
  p: Persona,
  system: string,
  user: string,
  temperature: number,
  schema: typeof TurnSchema | typeof TurnRound2Schema,
  abortMs: number,
): Promise<OnceOk> {
  const t0 = Date.now();
  try {
    const { output, usage } = await generateText({
      model: modelFor(p),
      system,
      prompt: user,
      output: Output.object({ schema, name: "turn" }),
      temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: AbortSignal.timeout(abortMs),
    });
    return {
      output: output as TurnPayload,
      latencyMs: Date.now() - t0,
      usage: {
        input: usage?.inputTokens ?? 0,
        output: usage?.outputTokens ?? 0,
      },
    };
  } catch (err) {
    const remaining = abortMs - (Date.now() - t0);
    if (remaining < 2_000) throw err;
    const { text, usage } = await generateText({
      model: modelFor(p),
      system: `${system}\n반드시 JSON 객체만 출력합니다.`,
      prompt: user,
      temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: AbortSignal.timeout(remaining),
    });
    const parsed = schema.parse(extractJsonObject(text)) as TurnPayload;
    return {
      output: parsed,
      latencyMs: Date.now() - t0,
      usage: {
        input: usage?.inputTokens ?? 0,
        output: usage?.outputTokens ?? 0,
      },
    };
  }
}

export async function callPersona(
  p: Persona,
  system: string,
  user: string,
  round: 1 | 2,
): Promise<PersonaCallResult> {
  const schema = round === 2 ? TurnRound2Schema : TurnSchema;
  const budgetStart = Date.now();
  try {
    const first = await once(p, system, user, p.temperature, schema, PERSONA_ABORT_MS);
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
      const second = await once(p, system, user, 0.2, schema, retryAbort);
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
