import { PERSONAS } from "@/config/personas";
import { AGENDA_MAX, AGENDA_MIN, DEFAULT_DAILY_SESSION_CAP } from "@/config/limits";
import { newSessionId } from "@/lib/id";
import { clientIp, hourKey, wouldExceed } from "@/lib/ratelimit";
import { MetricsSchema, SessionCreateSchema } from "@/lib/schema";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

void PERSONAS;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = SessionCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_agenda",
        message: `agenda는 ${AGENDA_MIN}~${AGENDA_MAX}자, category는 investment|marketing|staffing|pricing`,
      },
      { status: 400 },
    );
  }
  const uploaded = parsed.data.metrics
    ? MetricsSchema.safeParse(parsed.data.metrics)
    : { success: true as const, data: undefined };
  if (!uploaded.success) {
    return Response.json(
      {
        error: "invalid_metrics",
        message: "업로드한 지표가 스키마와 맞지 않습니다.",
      },
      { status: 400 },
    );
  }
  if (!supabaseConfigured()) {
    return Response.json(
      { error: "supabase_unconfigured" },
      { status: 503 },
    );
  }

  const db = getSupabase();
  const ip = clientIp(req.headers);
  const key = hourKey(ip, new Date());
  const { data: row } = await db
    .from("rate_limits")
    .select("count")
    .eq("key", key)
    .maybeSingle();
  const count = row?.count ?? 0;
  if (wouldExceed(count)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const cap = Number(process.env.DAILY_SESSION_CAP || DEFAULT_DAILY_SESSION_CAP);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count: today } = await db
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString());
  if ((today ?? 0) >= cap) {
    return Response.json(
      { error: "daily_cap", message: `오늘 세션 한도 ${cap}건` },
      { status: 429 },
    );
  }

  await db.from("rate_limits").upsert({
    key,
    count: count + 1,
    updated_at: new Date().toISOString(),
  });

  const id = newSessionId();
  const createdAt = new Date().toISOString();
  const { error } = await db.from("sessions").insert({
    id,
    agenda: parsed.data.agenda,
    category: parsed.data.category,
    metrics: uploaded.data ?? null,
    created_at: createdAt,
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ id, createdAt }, { status: 201 });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "missing_id" }, { status: 400 });
  }
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const db = getSupabase();
  const { data: session, error } = await db
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!session) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const { data: turns } = await db
    .from("turns")
    .select("*")
    .eq("session_id", id)
    .order("round")
    .order("persona");
  return Response.json({ session, turns: turns ?? [] });
}
