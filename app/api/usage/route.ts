import { z } from "zod";
import {
  summarizeUsage,
  utcMonthKey,
  withPersonaSlots,
  type UsageTurnRow,
} from "@/lib/cost";
import { loadBudgetUsd, loadLivePersonas } from "@/lib/run-round";
import { jsonFromCaught, jsonFromSupabaseError } from "@/lib/db-errors";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  monthlyBudgetUsd: z.coerce.number().min(1).max(10_000),
});

export async function GET() {
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  try {
    const db = getSupabase();
    const month = utcMonthKey();
    const { data, error } = await db
      .from("turns")
      .select("persona, provider, model, usage, created_at")
      .gte("created_at", `${month}-01T00:00:00.000Z`);
    if (error) {
      return jsonFromSupabaseError(error);
    }
    const budgetUsd = await loadBudgetUsd();
    const personas = await loadLivePersonas();
    const summary = summarizeUsage(
      (data ?? []) as UsageTurnRow[],
      budgetUsd,
    );
    return Response.json({
      ...summary,
      byPersona: withPersonaSlots(
        summary.byPersona,
        personas.map((p) => ({
          key: p.key,
          name: p.name,
          provider: p.provider,
          model: p.modelId,
        })),
      ),
      note: "여기는 Boardroom이 기록한 호출입니다. 각 사 계정 잔액은 콘솔에서 확인하세요.",
    });
  } catch (err) {
    return jsonFromCaught(err);
  }
}

export async function PATCH(req: Request) {
  if (!supabaseConfigured()) {
    return Response.json({ error: "supabase_unconfigured" }, { status: 503 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const db = getSupabase();
    const { error } = await db.from("app_settings").upsert({
      id: 1,
      monthly_budget_usd: parsed.data.monthlyBudgetUsd,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return jsonFromSupabaseError(error);
    }
    return Response.json({
      monthlyBudgetUsd: parsed.data.monthlyBudgetUsd,
    });
  } catch (err) {
    return jsonFromCaught(err);
  }
}
