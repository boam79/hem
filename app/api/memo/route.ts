import { jsonFromCaught, jsonFromSupabaseError } from "@/lib/db-errors";
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
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from("sessions")
      .update({ memo: parsed.data.memo })
      .eq("id", parsed.data.sessionId)
      .select("id")
      .maybeSingle();
    if (error) {
      return jsonFromSupabaseError(error);
    }
    if (!data) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return jsonFromCaught(err);
  }
}
