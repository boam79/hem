import { keepaliveAuthorized } from "@/lib/keepalive-auth";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

async function ping() {
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const pinged_at = new Date().toISOString();
  const db = getSupabase();
  const { error } = await db.from("keepalive").upsert({
    id: 1,
    pinged_at,
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, pinged_at });
}

export async function POST(req: Request) {
  if (!keepaliveAuthorized(req.headers)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return ping();
}

/** Vercel Cron is GET + Authorization: Bearer CRON_SECRET. */
export async function GET(req: Request) {
  if (!keepaliveAuthorized(req.headers)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return ping();
}
