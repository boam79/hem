import { describe, expect, it } from "vitest";
import { applyRoundStreamEvents, sseData, takeSseEvents } from "@/lib/sse";

describe("sse framing", () => {
  it("parses complete events and keeps a partial tail", () => {
    const chunk =
      sseData({ type: "delta", persona: "cfo", text: "보" }) +
      "data: {\"type\":\"delta\",\"persona\":\"cfo\",\"text\":\"류\"";
    const { events, rest } = takeSseEvents(chunk);
    expect(events).toEqual([
      { type: "delta", persona: "cfo", text: "보" },
    ]);
    expect(rest.startsWith("data:")).toBe(true);
  });

  it("accumulates token deltas until the round is done", () => {
    const folded = applyRoundStreamEvents(
      [
        { type: "delta", persona: "cfo", text: "보류" },
        { type: "delta", persona: "cfo", text: ". 현금" },
        {
          type: "done",
          round: 1,
          turns: [{ persona: "cfo", status: "ok" }],
        },
      ],
      {},
    );
    expect(folded.preview.cfo).toBe("보류. 현금");
    expect(folded.turns).toHaveLength(1);
    expect(folded.error).toBeNull();
  });
});
