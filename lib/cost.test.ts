import { describe, expect, it } from "vitest";
import {
  DEFAULT_MONTHLY_BUDGET_USD,
  formatUsd,
  parseTurnUsage,
  remainingUsd,
  summarizeUsage,
  usdForModel,
  utcMonthKey,
  withPersonaSlots,
} from "@/lib/cost";

describe("usdForModel", () => {
  it("prices haiku tokens in USD per million", () => {
    expect(usdForModel("claude-haiku-4-5-20251001", { input: 1_000_000, output: 0 })).toBe(1);
    expect(usdForModel("claude-haiku-4-5-20251001", { input: 0, output: 1_000_000 })).toBe(5);
  });
});

describe("remainingUsd", () => {
  it("does not go below zero", () => {
    expect(remainingUsd(10, 0.02)).toBe(9.98);
    expect(remainingUsd(10, 40)).toBe(0);
  });
});

describe("summarizeUsage", () => {
  it("sums this UTC month per persona and skips other months", () => {
    const month = utcMonthKey(new Date("2026-08-15T00:00:00Z"));
    const summary = summarizeUsage(
      [
        {
          persona: "cfo",
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          usage: { input: 1000, output: 200 },
          created_at: `${month}-01T00:00:00.000Z`,
        },
        {
          persona: "cfo",
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          usage: { input: 1000, output: 0 },
          created_at: `${month}-20T00:00:00.000Z`,
        },
        {
          persona: "mkt",
          provider: "openai",
          model: "gpt-5.4-nano",
          usage: { input: 5000, output: 500 },
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ],
      DEFAULT_MONTHLY_BUDGET_USD,
      new Date("2026-08-15T00:00:00Z"),
    );
    expect(summary.month).toBe("2026-08");
    expect(summary.byPersona).toHaveLength(1);
    expect(summary.byPersona[0]?.key).toBe("cfo");
    expect(summary.byPersona[0]?.input).toBe(2000);
    expect(summary.remainingUsd).toBeLessThan(DEFAULT_MONTHLY_BUDGET_USD);
    expect(formatUsd(0)).toBe("$0");
    expect(parseTurnUsage(null)).toEqual({ input: 0, output: 0 });
  });

  it("fills missing personas with zero usage", () => {
    const filled = withPersonaSlots(
      [
        {
          key: "cfo",
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          input: 100,
          output: 10,
          usd: 0.001,
        },
      ],
      [
        {
          key: "cfo",
          name: "재무이사",
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
        },
        {
          key: "mkt",
          name: "마케팅실장",
          provider: "openai",
          model: "gpt-5.4-nano",
        },
        {
          key: "md",
          name: "진료원장",
          provider: "google",
          model: "gemini-3.1-flash-lite",
        },
      ],
    );
    expect(filled).toHaveLength(3);
    expect(filled[0]?.name).toBe("재무이사");
    expect(filled[1]?.input).toBe(0);
    expect(filled[2]?.usd).toBe(0);
  });
});
