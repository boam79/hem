import { PERSONAS } from "@/config/personas";
import { callPersona } from "@/lib/llm";
import {
  buildRound1UserPrompt,
  buildRound2UserPrompt,
  buildSystemPrompt,
  loadMetrics,
  metricsToMarkdownTable,
} from "@/lib/prompt";
import { canStartRound2 } from "@/lib/round-gate";
import { RoundRequestSchema, type TurnPayload } from "@/lib/schema";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = RoundRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }

  const { sessionId, round } = parsed.data;
  const db = getSupabase();
  const { data: session } = await db
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { data: existing } = await db
    .from("turns")
    .select("id")
    .eq("session_id", sessionId)
    .eq("round", round)
    .limit(1);
  if (existing && existing.length > 0) {
    return Response.json({ error: "round_already_run" }, { status: 409 });
  }

  const { data: r1 } = await db
    .from("turns")
    .select("*")
    .eq("session_id", sessionId)
    .eq("round", 1);

  if (round === 2) {
    const ok = (r1 ?? []).filter((t) => t.status === "ok").length;
    if (!canStartRound2(ok)) {
      return Response.json(
        { error: "round1_insufficient" },
        { status: 422 },
      );
    }
  }

  const metrics = loadMetrics();
  const table = metricsToMarkdownTable(metrics);

  const results = await Promise.allSettled(
    PERSONAS.map(async (p) => {
      const system = buildSystemPrompt(p, metrics);
      let user = buildRound1UserPrompt(session.agenda, table);
      if (round === 2) {
        const others = (r1 ?? [])
          .filter((t) => t.persona !== p.key && t.status === "ok")
          .map((t) => ({
            name: PERSONAS.find((x) => x.key === t.persona)?.name ?? t.persona,
            payload: t.payload as TurnPayload,
          }));
        user = buildRound2UserPrompt(session.agenda, table, others);
      }
      return callPersona(p, system, user, round);
    }),
  );

  const turns = [];
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i];
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

  return Response.json({ round, turns });
}
