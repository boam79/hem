import type { Persona } from "@/config/personas";
import { DEFAULT_MONTHLY_BUDGET_USD } from "@/lib/cost";
import { callPersona, type PersonaDeltaHandler } from "@/lib/llm";
import {
  mergePersonas,
  PersonaOverrideSchema,
  type PersonaOverride,
} from "@/lib/persona-overrides";
import {
  buildRound1UserPrompt,
  buildRound2UserPrompt,
  buildSystemPrompt,
  metricsForSession,
  metricsToMarkdownTable,
} from "@/lib/prompt";
import { canStartRound2 } from "@/lib/round-gate";
import type { PersonaKey, TurnPayload } from "@/lib/schema";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export type RoundTurnOut = {
  persona: PersonaKey;
  provider: string;
  model: string;
  status: "ok" | "failed";
  payload?: TurnPayload;
  error?: string;
  latencyMs: number;
  usage?: { input: number; output: number };
};

export type RunRoundResult =
  | { ok: false; status: number; error: string }
  | { ok: true; turns: RoundTurnOut[] };

export async function loadLivePersonas(): Promise<[Persona, Persona, Persona]> {
  if (!supabaseConfigured()) return mergePersonas([]);
  const db = getSupabase();
  const { data } = await db.from("persona_overrides").select("*");
  const overrides: PersonaOverride[] = [];
  for (const row of data ?? []) {
    const parsed = PersonaOverrideSchema.safeParse({
      key: row.key,
      name: row.name,
      role: row.role,
      habits: row.habits,
      temperature: Number(row.temperature),
    });
    if (parsed.success) overrides.push(parsed.data);
  }
  return mergePersonas(overrides);
}

export async function loadBudgetUsd(): Promise<number> {
  if (!supabaseConfigured()) return DEFAULT_MONTHLY_BUDGET_USD;
  const db = getSupabase();
  const { data } = await db
    .from("app_settings")
    .select("monthly_budget_usd")
    .eq("id", 1)
    .maybeSingle();
  const value = Number(data?.monthly_budget_usd);
  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_MONTHLY_BUDGET_USD;
}

export async function runRound(opts: {
  sessionId: string;
  round: 1 | 2;
  onDelta?: (persona: PersonaKey, delta: string) => void;
}): Promise<RunRoundResult> {
  if (!supabaseConfigured()) {
    return { ok: false, status: 503, error: "supabase_unconfigured" };
  }
  const { sessionId, round, onDelta } = opts;
  const db = getSupabase();
  const { data: session } = await db
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return { ok: false, status: 404, error: "not_found" };
  }

  const { data: existing } = await db
    .from("turns")
    .select("id")
    .eq("session_id", sessionId)
    .eq("round", round)
    .limit(1);
  if (existing && existing.length > 0) {
    return { ok: false, status: 409, error: "round_already_run" };
  }

  const { data: r1 } = await db
    .from("turns")
    .select("*")
    .eq("session_id", sessionId)
    .eq("round", 1);

  if (round === 2) {
    const ok = (r1 ?? []).filter((t) => t.status === "ok").length;
    if (!canStartRound2(ok)) {
      return { ok: false, status: 422, error: "round1_insufficient" };
    }
  }

  const personas = await loadLivePersonas();
  const metrics = metricsForSession(session);
  const table = metricsToMarkdownTable(metrics);

  const results = await Promise.allSettled(
    personas.map(async (p) => {
      const system = buildSystemPrompt(p, metrics);
      let user = buildRound1UserPrompt(session.agenda, table);
      if (round === 2) {
        const others = (r1 ?? [])
          .filter((t) => t.persona !== p.key && t.status === "ok")
          .map((t) => ({
            name: personas.find((x) => x.key === t.persona)?.name ?? t.persona,
            payload: t.payload as TurnPayload,
          }));
        user = buildRound2UserPrompt(session.agenda, table, others);
      }
      const delta: PersonaDeltaHandler | undefined = onDelta
        ? (text) => onDelta(p.key, text)
        : undefined;
      return callPersona(p, system, user, round, delta);
    }),
  );

  const turns: RoundTurnOut[] = [];
  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    const settled = results[i];
    const body =
      settled.status === "fulfilled"
        ? settled.value
        : {
            status: "failed" as const,
            error: String(settled.reason),
            latencyMs: 0,
            model: p.modelId,
            provider: p.provider,
          };
    const row = {
      session_id: sessionId,
      round,
      persona: p.key,
      provider: p.provider,
      model: body.model,
      status: body.status,
      payload: body.status === "ok" ? body.payload : null,
      error: body.status === "failed" ? body.error : null,
      usage: body.status === "ok" ? body.usage : null,
      latency_ms: body.latencyMs,
    };
    await db.from("turns").insert(row);
    turns.push({
      persona: p.key,
      provider: p.provider,
      model: body.model,
      status: body.status,
      payload: body.status === "ok" ? body.payload : undefined,
      error: body.status === "failed" ? body.error : undefined,
      latencyMs: body.latencyMs,
      usage: body.status === "ok" ? body.usage : undefined,
    });
  }

  return { ok: true, turns };
}
