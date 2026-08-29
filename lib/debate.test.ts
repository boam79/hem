import { describe, expect, it } from "vitest";
import { cellsForRound, type DebateTurnRow } from "@/lib/debate";

describe("cellsForRound", () => {
  it("drops the round field and keeps the matching cells", () => {
    const turns: DebateTurnRow[] = [
      {
        persona: "cfo",
        provider: "anthropic",
        round: 1,
        status: "ok",
      },
      {
        persona: "cfo",
        provider: "anthropic",
        round: 2,
        status: "ok",
        payload: {
          position: "보류",
          evidence: [],
          risks: [],
          needs_data: [],
          objection: "반대 문장",
          changed: "유지",
        },
      },
    ];
    expect(cellsForRound(turns, 1)).toEqual([
      {
        persona: "cfo",
        provider: "anthropic",
        status: "ok",
        payload: undefined,
        error: undefined,
      },
    ]);
    expect(cellsForRound(turns, 2)[0]?.payload?.objection).toBe("반대 문장");
  });
});
