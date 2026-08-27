import { MemoPutSchema } from "@/lib/schema";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export async function PUT(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = MemoPutSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_memo" }, { status: 400 });
  }
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const db = getSupabase();
  const { data, error } = await db
    .from("sessions")
    .update({ memo: parsed.data.memo })
    .eq("id", parsed.data.sessionId)
    .select("id")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
