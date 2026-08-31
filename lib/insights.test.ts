import { describe, expect, it } from "vitest";
import demoShare from "@/data/demo-share.json";
import type { DebateTurnRow } from "@/lib/debate";
import { insightsAreEmpty, insightsFromTurns } from "@/lib/insights";

describe("insightsFromTurns", () => {
  const turns = demoShare.turns as DebateTurnRow[];

  it("pulls round-2 objections and needed data without a fourth model", () => {
    const insights = insightsFromTurns(turns);
    expect(insights.objections).toHaveLength(3);
    expect(insights.objections.map((row) => row.persona).sort()).toEqual([
      "cfo",
      "md",
      "mkt",
    ]);
    expect(insights.objections[0]?.text).toContain("획득비용");
    expect(insights.needsData.some((row) => row.text.includes("유치비용"))).toBe(
      true,
    );
    expect(insights.risks.length).toBeGreaterThan(0);
  });

  it("is empty when there are no ok turns", () => {
    expect(
      insightsAreEmpty(
        insightsFromTurns([
          {
            persona: "cfo",
            provider: "anthropic",
            round: 1,
            status: "failed",
          },
        ]),
      ),
    ).toBe(true);
  });
});
