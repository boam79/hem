import { describe, expect, it } from "vitest";
import {
  MemoSchema,
  SessionCreateSchema,
  TurnLlmSchema,
  TurnRound2LlmSchema,
  TurnRound2Schema,
  TurnSchema,
  parseTurnPayload,
  isRound2EmptyFieldError,
  ROUND2_EMPTY_FIELDS_ERROR,
} from "@/lib/schema";
import {
  jsonOnlySuffix,
  loadMetrics,
  metricsToMarkdownTable,
  retrySystemPrompt,
  round2EmptyRetrySuffix,
  round2SystemHint,
} from "@/lib/prompt";
import { estimateTokens } from "@/lib/tokens";
import { clientIp, hourKey, wouldExceed } from "@/lib/ratelimit";
import { PERSONAS, ROUND2_RULES } from "@/config/personas";
import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";
import { apiErrorMessage } from "@/lib/api-errors";
import { agendaError, isAgendaValid } from "@/lib/agenda";
import { extractJsonObject, humanizeModelError } from "@/lib/json";
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
  it("round 1 schema has no optional keys", () => {
    const r = TurnSchema.safeParse({
      position: "보류",
      evidence: ["inflow.search_ad 2026-07"],
      risks: [],
      needs_data: [],
    });
    expect(r.success).toBe(true);
  });
  it("llm schemas require every property (OpenAI structured output)", () => {
    const r1 = {
      position: "보류",
      evidence: ["inflow.search_ad 2026-07"],
      risks: [],
      needs_data: [],
    };
    expect(TurnLlmSchema.safeParse(r1).success).toBe(true);
    expect(TurnLlmSchema.safeParse({ position: "보류" }).success).toBe(false);
    expect(TurnRound2LlmSchema.safeParse(r1).success).toBe(false);
    expect(
      TurnRound2LlmSchema.safeParse({
        ...r1,
        objection: "회수 가정이 없습니다",
        changed: "유지: 현금흐름 우선",
      }).success,
    ).toBe(true);
  });
  it("clips overlong cheap-model fields after JSON recovery", () => {
    const parsed = parseTurnPayload(
      {
        position: "가".repeat(500),
        evidence: ["b".repeat(100), "c", "d", "e", "f"],
        risks: ["r".repeat(200)],
        needs_data: ["n".repeat(120)],
      },
      1,
    );
    expect(parsed.position).toHaveLength(200);
    expect(parsed.evidence).toHaveLength(4);
    expect(parsed.evidence[0]).toHaveLength(60);
    expect(parsed.risks[0]).toHaveLength(120);
    expect(parsed.needs_data[0]).toHaveLength(80);
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
  it("round 2 rejects empty or whitespace objection", () => {
    const base = {
      position: "반대합니다",
      evidence: ["inflow.search_ad 2026-07"],
      risks: ["고정비"],
      needs_data: [],
      changed: "유지: 현금흐름 우선",
    };
    expect(() =>
      parseTurnPayload({ ...base, objection: "" }, 2),
    ).toThrow(ROUND2_EMPTY_FIELDS_ERROR);
    expect(() =>
      parseTurnPayload({ ...base, objection: "   " }, 2),
    ).toThrow(ROUND2_EMPTY_FIELDS_ERROR);
    expect(() =>
      parseTurnPayload({ ...base, objection: "회수 가정이 없습니다", changed: "" }, 2),
    ).toThrow(ROUND2_EMPTY_FIELDS_ERROR);
    expect(() =>
      parseTurnPayload({ ...base, objection: "\t", changed: "  " }, 2),
    ).toThrow(ROUND2_EMPTY_FIELDS_ERROR);
  });
  it("jsonrepair of empty objection still fails parse (not a recovery)", () => {
    const recovered = extractJsonObject(
      '{"objection":"","changed":"","position":"보류","evidence":["a"],"risks":[],"needs_data":[]}',
    );
    expect(() => parseTurnPayload(recovered, 2)).toThrow(
      ROUND2_EMPTY_FIELDS_ERROR,
    );
  });
});

describe("metrics", () => {
  it("validates MetricsSchema and stays under 1000-token table budget", () => {
    const m = loadMetrics();
    const table = metricsToMarkdownTable(m);
    expect(m._note).toMatch(/유사성 없음/);
    expect(m.hospital.name).toBe("S안과(가상)");
    expect(m.hospital.doctors).toBe(4);
    expect(m.period).toEqual({ from: "2025-08", to: "2026-07" });
    expect(m.monthly).toHaveLength(12);
    expect(estimateTokens(table)).toBeLessThanOrEqual(METRICS_TABLE_TOKEN_LIMIT);
    expect(METRICS_TABLE_TOKEN_LIMIT).toBe(1_000);
  });
});

describe("ratelimit", () => {
  it("builds hour keys and detects the 11th session", () => {
    const key = hourKey("1.2.3.4", new Date("2026-08-27T15:00:00Z"));
    expect(key).toBe("ip:1.2.3.4:2026082715");
    expect(wouldExceed(10)).toBe(true);
    expect(wouldExceed(9)).toBe(false);
  });
  it("uses the first x-forwarded-for hop as the client IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    });
    expect(clientIp(headers)).toBe("203.0.113.9");
  });
});

describe("api errors", () => {
  it("maps 409, 422, and 429 codes to Korean copy", () => {
    expect(apiErrorMessage({ error: "round_already_run" })).toMatch(/이미 실행/);
    expect(apiErrorMessage({ error: "round1_insufficient" })).toMatch(/2개 미만/);
    expect(apiErrorMessage({ error: "rate_limited" })).toMatch(/한 시간/);
    expect(apiErrorMessage({ error: "daily_cap" })).toMatch(/한도/);
    expect(apiErrorMessage({ error: "invalid_agenda" })).toMatch(/안건/);
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
  it("uses three distinct cheap models", () => {
    expect(PERSONAS.map((p) => p.modelId)).toEqual([
      "claude-haiku-4-5-20251001",
      "gpt-5.4-nano",
      "gemini-3.1-flash-lite",
    ]);
  });
  it("uses three distinct providers so the F5 build guard stays armed", () => {
    const providers = PERSONAS.map((p) => p.provider);
    expect(providers).toEqual(["anthropic", "openai", "google"]);
    expect(new Set(providers).size).toBe(3);
  });
  it("round 2 rules require objection and changed", () => {
    expect(ROUND2_RULES).toMatch(/objection/);
    expect(ROUND2_RULES).toMatch(/changed/);
    expect(ROUND2_RULES).toMatch(/한 문장/);
    expect(ROUND2_RULES).toMatch(/맨 앞/);
  });
});

describe("json-only retry hint", () => {
  it("round 2 example includes non-empty objection and changed", () => {
    const r1 = jsonOnlySuffix(1);
    const r2 = jsonOnlySuffix(2);
    expect(r1).not.toMatch(/objection/);
    expect(r2).toMatch(/"objection":"[^"]+"/);
    expect(r2).toMatch(/"changed":"[^"]+"/);
    expect(r2).toMatch(/빈 문자열 금지|비우지 않습니다/);
  });
  it("round 2 min example puts objection and changed first", () => {
    const r2 = jsonOnlySuffix(2);
    expect(r2).toMatch(
      /\{"objection":"[^"]+","changed":"[^"]+","position":/,
    );
  });
});

describe("round 2 empty-field retry path", () => {
  it("classifies empty objection/changed errors for a dedicated retry", () => {
    expect(isRound2EmptyFieldError(new Error(ROUND2_EMPTY_FIELDS_ERROR))).toBe(
      true,
    );
    expect(isRound2EmptyFieldError(new Error("no json object in model text"))).toBe(
      false,
    );
    expect(isRound2EmptyFieldError("round2 requires non-empty objection and changed")).toBe(
      true,
    );
  });
  it("empty R2 error selects the filled Korean min example retry prompt", () => {
    const err = new Error(ROUND2_EMPTY_FIELDS_ERROR);
    const reason = isRound2EmptyFieldError(err) ? "empty-r2" : "json";
    expect(reason).toBe("empty-r2");
    const sys = retrySystemPrompt("base-system", 2, reason);
    expect(sys).toMatch(/이전 출력이 거부/);
    expect(sys).toMatch(/"objection":"마케팅의 회수 가정이 없습니다"/);
    expect(sys).toMatch(/"changed":"유지: 현금흐름 우선"/);
    expect(sys.indexOf('"objection"')).toBeLessThan(sys.indexOf('"position"'));
  });
  it("json parse failures keep the generic JSON suffix, not the empty-field one", () => {
    const err = new Error("no json object in model text");
    const reason = isRound2EmptyFieldError(err) ? "empty-r2" : "json";
    expect(reason).toBe("json");
    const sys = retrySystemPrompt("base-system", 2, reason);
    expect(sys).toMatch(/반드시 JSON 객체만/);
    expect(sys).not.toMatch(/이전 출력이 거부/);
  });
  it("Haiku R2 hint forbids empty objection in one short Korean sentence", () => {
    const hint = round2SystemHint("anthropic");
    expect(hint).toMatch(/objection/);
    expect(hint).toMatch(/한 문장/);
    expect(hint).toMatch(/따옴표/);
    expect(round2EmptyRetrySuffix()).toMatch(/마케팅의 회수 가정이 없습니다/);
  });
});

describe("json helpers", () => {
  it("extracts an object from fenced text", () => {
    const value = extractJsonObject('말\n{"position":"보류","evidence":["a"]}');
    expect(value).toEqual({ position: "보류", evidence: ["a"] });
  });
  it("strips markdown fences and trailing commas", () => {
    const value = extractJsonObject(
      '```json\n{"position":"보류","evidence":["a"],}\n```',
    );
    expect(value).toEqual({ position: "보류", evidence: ["a"] });
  });
  it("reads JSON text off a structured-output error", async () => {
    const { textFromUnknownError } = await import("@/lib/json");
    expect(
      textFromUnknownError({
        text: '{"position":"보류","evidence":["a"]}',
      }),
    ).toContain("position");
    expect(textFromUnknownError(new Error("fail"))).toBeUndefined();
  });
  it("humanizes credit errors", () => {
    expect(humanizeModelError("Failed: prepayment credits are exhausted")).toBe(
      "모델 크레딧이 부족합니다.",
    );
  });
  it("recovers unescaped quotes in array elements (Haiku)", () => {
    const value = extractJsonObject(
      '{"position":"보류","evidence":["inflow.search_ad 2026-07 "검색광고""],"risks":[],"needs_data":[]}',
    );
    expect(value).toMatchObject({
      position: "보류",
      evidence: ['inflow.search_ad 2026-07 "검색광고"'],
    });
  });
  it("recovers missing commas between array elements", () => {
    const value = extractJsonObject(
      '{"position":"보류","evidence":["inflow.search_ad 2026-07" "revenue_mix.cataract 2026-07"],"risks":[],"needs_data":[]}',
    );
    expect(value).toEqual({
      position: "보류",
      evidence: ["inflow.search_ad 2026-07", "revenue_mix.cataract 2026-07"],
      risks: [],
      needs_data: [],
    });
  });
  it("recovers unescaped quotes in property values (nano)", () => {
    const value = extractJsonObject(
      '{"position":"회수 "불확실"이라 보류","evidence":["inflow.search_ad 2026-07"],"risks":[],"needs_data":[]}',
    );
    expect(value).toMatchObject({
      position: '회수 "불확실"이라 보류',
      evidence: ["inflow.search_ad 2026-07"],
    });
  });
  it("recovers truncated JSON without a closing brace", () => {
    const value = extractJsonObject(
      '{"position":"보류합니다","evidence":["inflow.search_ad 2026-07"],"risks":["고정비 증가',
    );
    expect(value).toMatchObject({
      position: "보류합니다",
      evidence: ["inflow.search_ad 2026-07"],
      risks: ["고정비 증가"],
    });
  });
  it("recovers unescaped newlines inside strings", () => {
    const value = extractJsonObject(
      '{"position":"보류합니다.\n현금 우선","evidence":["a"],"risks":[],"needs_data":[]}',
    );
    expect(value).toMatchObject({
      position: "보류합니다.\n현금 우선",
      evidence: ["a"],
    });
  });
  it("recovers fullwidth colon that jsonrepair reports as Colon expected", () => {
    const value = extractJsonObject(
      '{"position":"보류","evidence":["inflow.search_ad 2026-07"],"risks":[],"needs_data":[],"objection"："회수 가정이 없습니다","changed":"유지: 현금흐름"}',
    );
    expect(value).toMatchObject({
      position: "보류",
      evidence: ["inflow.search_ad 2026-07"],
      objection: "회수 가정이 없습니다",
      changed: "유지: 현금흐름",
    });
  });
  it("recovers missing colon before an unquoted Korean R2 value", () => {
    const value = extractJsonObject(
      '{"position":"보류","evidence":["a"],"risks":[],"needs_data":[],"objection" 회수 가정이 없습니다,"changed":"유지: 현금흐름"}',
    );
    expect(value).toMatchObject({
      position: "보류",
      objection: "회수 가정이 없습니다",
      changed: "유지: 현금흐름",
    });
  });
});

describe("cheap-model call options", () => {
  it("omits temperature for OpenAI and sets none reasoning", async () => {
    const { callOptions, structuredAbortMs } = await import("@/lib/llm-options");
    const openai = PERSONAS.find((p) => p.provider === "openai")!;
    const anthropic = PERSONAS.find((p) => p.provider === "anthropic")!;
    expect(callOptions(openai, 0.7)).toEqual({
      providerOptions: { openai: { reasoningEffort: "none" } },
    });
    expect(callOptions(anthropic, 0.4)).toEqual({ temperature: 0.4 });
    expect(structuredAbortMs(22_000)).toBe(14_000);
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
