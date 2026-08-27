import { describe, expect, it } from "vitest";
import { SessionCreateSchema, TurnRound2Schema, TurnSchema } from "@/lib/schema";
import { loadMetrics, metricsToMarkdownTable } from "@/lib/prompt";
import { estimateTokens } from "@/lib/tokens";
import { hourKey, wouldExceed } from "@/lib/ratelimit";
import { PERSONAS } from "@/config/personas";
import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";

describe("SessionCreateSchema", () => {
  it("rejects agenda shorter than 10", () => {
    const r = SessionCreateSchema.safeParse({
      agenda: "짧다",
      category: "marketing",
    });
    expect(r.success).toBe(false);
  });
  it("rejects agenda longer than 200", () => {
    const r = SessionCreateSchema.safeParse({
      agenda: "가".repeat(201),
      category: "marketing",
    });
    expect(r.success).toBe(false);
  });
  it("accepts valid agenda", () => {
    const r = SessionCreateSchema.safeParse({
      agenda: "백내장 검색광고 예산 30% 증액",
      category: "marketing",
    });
    expect(r.success).toBe(true);
  });
});

describe("TurnSchema", () => {
  it("requires evidence", () => {
    const r = TurnSchema.safeParse({
      position: "보류",
      evidence: [],
      risks: [],
      needs_data: [],
    });
    expect(r.success).toBe(false);
  });
  it("round 2 requires objection and changed", () => {
    const base = {
      position: "반대합니다",
      evidence: ["inflow.search_ad 2026-07"],
      risks: ["고정비"],
      needs_data: [],
    };
    expect(TurnRound2Schema.safeParse(base).success).toBe(false);
    expect(
      TurnRound2Schema.safeParse({
        ...base,
        objection: "마케팅의 회수 가정이 없습니다",
        changed: "유지: 현금흐름 우선",
      }).success,
    ).toBe(true);
  });
});

describe("metrics", () => {
  it("validates and stays under token budget", () => {
    const m = loadMetrics();
    const table = metricsToMarkdownTable(m);
    expect(m.monthly).toHaveLength(12);
    expect(estimateTokens(table)).toBeLessThanOrEqual(METRICS_TABLE_TOKEN_LIMIT);
  });
});

describe("ratelimit", () => {
  it("builds hour keys and detects the 11th session", () => {
    const key = hourKey("1.2.3.4", new Date("2026-08-27T15:00:00Z"));
    expect(key).toBe("ip:1.2.3.4:2026082715");
    expect(wouldExceed(10)).toBe(true);
    expect(wouldExceed(9)).toBe(false);
  });
});

describe("personas", () => {
  it("uses three distinct providers", () => {
    const set = new Set(PERSONAS.map((p) => p.provider));
    expect(set.size).toBe(3);
  });
});
