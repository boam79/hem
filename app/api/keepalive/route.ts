import { keepaliveAuthorized } from "@/lib/keepalive-auth";
import { jsonFromCaught, jsonFromSupabaseError } from "@/lib/db-errors";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

async function ping() {
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const pinged_at = new Date().toISOString();
  try {
    const db = getSupabase();
    const { error } = await db.from("keepalive").upsert({
      id: 1,
      pinged_at,
    });
    if (error) {
      return jsonFromSupabaseError(error);
    }
    return Response.json({ ok: true, pinged_at });
  } catch (err) {
    return jsonFromCaught(err);
  }
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
