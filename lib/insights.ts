import type { DebateTurnRow } from "@/lib/debate";
import { koreanizePublicText } from "@/lib/ko-display";
import { PersonaKeySchema, type PersonaKey } from "@/lib/schema";

export type InsightLine = {
  persona: PersonaKey;
  round: number;
  text: string;
};

export type DebateInsights = {
  objections: InsightLine[];
  risks: InsightLine[];
  needsData: InsightLine[];
};

function asPersona(value: string): PersonaKey | null {
  const parsed = PersonaKeySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function pushUnique(
  bucket: InsightLine[],
  persona: PersonaKey,
  round: number,
  raw: string | undefined,
): void {
  const text = koreanizePublicText(raw ?? "").trim();
  if (!text) return;
  if (bucket.some((row) => row.persona === persona && row.text === text)) return;
  bucket.push({ persona, round, text });
}

export function insightsFromTurns(turns: DebateTurnRow[]): DebateInsights {
  const objections: InsightLine[] = [];
  const risks: InsightLine[] = [];
  const needsData: InsightLine[] = [];
  const ordered = [...turns].sort((a, b) => a.round - b.round);

  for (const turn of ordered) {
    if (turn.status !== "ok" || !turn.payload) continue;
    const persona = asPersona(turn.persona);
    if (!persona) continue;
    if (turn.round === 2) {
      pushUnique(objections, persona, turn.round, turn.payload.objection);
    }
    for (const risk of turn.payload.risks ?? []) {
      pushUnique(risks, persona, turn.round, risk);
    }
    for (const need of turn.payload.needs_data ?? []) {
      pushUnique(needsData, persona, turn.round, need);
    }
  }

  return { objections, risks, needsData };
}

export function insightsAreEmpty(insights: DebateInsights): boolean {
  return (
    insights.objections.length === 0 &&
    insights.risks.length === 0 &&
    insights.needsData.length === 0
  );
}
