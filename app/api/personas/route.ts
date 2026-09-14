import { PERSONAS } from "@/config/personas";
import {
  PersonaOverridesBodySchema,
  mergePersonas,
  publicPersonas,
} from "@/lib/persona-overrides";
import { loadLivePersonas } from "@/lib/run-round";
import { jsonFromCaught, jsonFromSupabaseError, isDbNetworkError } from "@/lib/db-errors";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const personas = supabaseConfigured()
      ? await loadLivePersonas()
      : PERSONAS;
    return Response.json({ personas: publicPersonas(personas) });
  } catch (err) {
    if (isDbNetworkError(err)) {
      return Response.json({ personas: publicPersonas(PERSONAS) });
    }
    return jsonFromCaught(err);
  }
}

export async function PUT(req: Request) {
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PersonaOverridesBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const keys = parsed.data.personas.map((p) => p.key);
  if (new Set(keys).size !== 3) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const merged = mergePersonas(parsed.data.personas);
  if (new Set(merged.map((p) => p.provider)).size !== 3) {
    return Response.json({ error: "providers_must_differ" }, { status: 400 });
  }
  try {
    const db = getSupabase();
    const now = new Date().toISOString();
    for (const row of parsed.data.personas) {
      const { error } = await db.from("persona_overrides").upsert({
        key: row.key,
        name: row.name,
        role: row.role,
        habits: row.habits,
        temperature: row.temperature,
        updated_at: now,
      });
      if (error) {
        return jsonFromSupabaseError(error);
      }
    }
    return Response.json({ personas: publicPersonas(merged) });
  } catch (err) {
    return jsonFromCaught(err);
  }
}

export async function DELETE() {
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  try {
    const db = getSupabase();
    await db.from("persona_overrides").delete().in("key", ["cfo", "mkt", "md"]);
    return Response.json({ personas: publicPersonas(PERSONAS) });
  } catch (err) {
    return jsonFromCaught(err);
  }
}
