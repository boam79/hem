import { supabaseConfigured, supabaseReachable } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = supabaseConfigured();
  const reachable = configured ? await supabaseReachable() : false;
  return Response.json({
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    google: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    supabase: configured && reachable,
  });
}
