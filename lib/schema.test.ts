import { describe, expect, it } from "vitest";
import {
  MemoSchema,
  SessionCreateSchema,
  TurnRound2Schema,
  TurnSchema,
} from "@/lib/schema";
import { loadMetrics, metricsToMarkdownTable } from "@/lib/prompt";
import { estimateTokens } from "@/lib/tokens";
import { hourKey, wouldExceed } from "@/lib/ratelimit";
import { PERSONAS, ROUND2_RULES } from "@/config/personas";
import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";
import { agendaError, isAgendaValid } from "@/lib/agenda";
import demoShare from "@/data/demo-share.json";

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

describe("round 2 gate", () => {
  it("blocks when fewer than two round 1 cells succeeded", async () => {
    const { canStartRound2 } = await import("@/lib/round-gate");
    expect(canStartRound2(1)).toBe(false);
    expect(canStartRound2(2)).toBe(true);
    expect(canStartRound2(3)).toBe(true);
  });
});

describe("personas", () => {
  it("uses three distinct providers", () => {
    const set = new Set(PERSONAS.map((p) => p.provider));
    expect(set.size).toBe(3);
  });
  it("round 2 rules require objection and changed", () => {
    expect(ROUND2_RULES).toMatch(/objection/);
    expect(ROUND2_RULES).toMatch(/changed/);
  });
});

describe("agenda client guard", () => {
  it("rejects short and long agendas", () => {
    expect(isAgendaValid("짧다")).toBe(false);
    expect(agendaError("짧다")).toMatch(/10자/);
    expect(isAgendaValid("가".repeat(201))).toBe(false);
    expect(isAgendaValid("백내장 검색광고 예산 30% 증액")).toBe(true);
  });
});

describe("health gate", () => {
  it("requires all four flags for live debate", async () => {
    const { isLiveDebateReady } = await import("@/lib/health");
    expect(
      isLiveDebateReady({
        anthropic: true,
        openai: true,
        google: true,
        supabase: true,
      }),
    ).toBe(true);
    expect(
      isLiveDebateReady({
        anthropic: true,
        openai: true,
        google: true,
        supabase: false,
      }),
    ).toBe(false);
  });
});

describe("demo replay fixture", () => {
  it("maps two rounds and a four-field memo", async () => {
    const { demoAgenda, demoCells, demoMemo } = await import("@/lib/demo-share");
    expect(demoAgenda()).toBe("백내장 검색광고 예산 30% 증액");
    expect(demoCells(1)).toHaveLength(3);
    expect(demoCells(2)).toHaveLength(3);
    expect(demoCells(2).every((cell) => cell.payload?.objection)).toBe(true);
    expect(demoMemo().options).toHaveLength(2);
  });
});

describe("memo and demo fixture", () => {
  it("accepts a four-field memo", () => {
    const r = MemoSchema.safeParse(demoShare.memo);
    expect(r.success).toBe(true);
  });
  it("demo round 2 cells include objection and changed", () => {
    const r2 = demoShare.turns.filter((t) => t.round === 2);
    expect(r2).toHaveLength(3);
    for (const turn of r2) {
      expect(TurnRound2Schema.safeParse(turn.payload).success).toBe(true);
    }
  });
});
