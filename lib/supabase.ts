import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isDbNetworkError } from "@/lib/db-errors";

export function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  if (key && process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("service role key must not be a NEXT_PUBLIC_ variable");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** Env may be set while the Free project is paused. Health must ping. */
export async function supabaseReachable(): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  try {
    const db = getSupabase();
    const { error } = await db.from("sessions").select("id").limit(1);
    if (error && isDbNetworkError(error.message)) return false;
    return true;
  } catch {
    return false;
  }
}
