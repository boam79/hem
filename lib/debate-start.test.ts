import { describe, expect, it } from "vitest";
import {
  DEFAULT_SESSION_CATEGORY,
  debateStartBody,
  shouldStartWithUploadedMetrics,
} from "@/lib/debate-start";
import { loadMetrics } from "@/lib/prompt";

const agenda = "백내장 검색광고 예산을 30% 늘릴지 검토한다";

describe("shouldStartWithUploadedMetrics", () => {
  it("is true only when parsed metrics are in memory", () => {
    expect(shouldStartWithUploadedMetrics(null)).toBe(false);
    expect(shouldStartWithUploadedMetrics(loadMetrics())).toBe(true);
  });
});

describe("debateStartBody", () => {
  it("includes uploaded metrics only when the user chose them", () => {
    const metrics = loadMetrics();
    expect(
      debateStartBody({
        agenda: `  ${agenda}  `,
        category: "marketing",
        metrics,
        useUploadedMetrics: true,
      }),
    ).toEqual({
      agenda,
      category: "marketing",
      metrics,
    });
  });

  it("omits uploaded metrics when the user continues without them", () => {
    expect(
      debateStartBody({
        agenda,
        category: "investment",
        metrics: loadMetrics(),
        useUploadedMetrics: false,
      }),
    ).toEqual({
      agenda,
      category: "investment",
    });
  });

  it("omits metrics when nothing is uploaded even if the user asked for them", () => {
    expect(
      debateStartBody({
        agenda,
        category: "staffing",
        metrics: null,
        useUploadedMetrics: true,
      }),
    ).toEqual({
      agenda,
      category: "staffing",
    });
  });

  it("defaults category so the home UI does not need a type dropdown", () => {
    expect(
      debateStartBody({
        agenda,
        metrics: null,
        useUploadedMetrics: false,
      }),
    ).toEqual({
      agenda,
      category: DEFAULT_SESSION_CATEGORY,
    });
  });
});
