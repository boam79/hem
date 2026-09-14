import { describe, expect, it } from "vitest";
import {
  buildRound1UserPrompt,
  buildRound2UserPrompt,
  loadMetrics,
  metricsPromptSourceLine,
  promptSourceFromSession,
} from "@/lib/prompt";

const agenda = "백내장 검색광고 예산을 30% 늘릴지 검토한다";

describe("metrics prompt source", () => {
  it("marks a session with stored metrics as an upload", () => {
    const metrics = loadMetrics();
    expect(promptSourceFromSession({ metrics }, metrics)).toEqual({
      uploaded: true,
      hospitalName: metrics.hospital.name,
    });
    expect(promptSourceFromSession({}, metrics).uploaded).toBe(false);
  });

  it("tells round 1 to cite the uploaded hospital table", () => {
    const source = {
      uploaded: true,
      hospitalName: "업로드안과(가상)",
    };
    const prompt = buildRound1UserPrompt(agenda, "| 월 | 순현금 |", source);
    expect(prompt).toContain("사용자가 올린 파일");
    expect(prompt).toContain("업로드안과(가상)");
    expect(prompt).toContain(agenda);
    expect(metricsPromptSourceLine(source)).toMatch(/올린 파일/);
  });

  it("keeps the bundled-metrics note when nothing was uploaded", () => {
    const source = { uploaded: false, hospitalName: "S안과(가상)" };
    const prompt = buildRound2UserPrompt(
      agenda,
      "| 월 | 순현금 |",
      [
        {
          name: "마케팅실장",
          payload: {
            position: "보류",
            evidence: ["검색광고 유입 2026-07"],
            risks: [],
            needs_data: [],
          },
        },
      ],
      source,
    );
    expect(prompt).toContain("기본 합성 지표");
    expect(prompt).toContain("S안과(가상)");
  });
});
