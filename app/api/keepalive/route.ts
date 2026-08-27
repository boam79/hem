import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  const secret = process.env.KEEPALIVE_SECRET;
  const got = req.headers.get("x-keepalive-secret");
  if (!secret || got !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const db = getSupabase();
  const { error } = await db.from("keepalive").upsert({
    id: 1,
    pinged_at: new Date().toISOString(),
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
