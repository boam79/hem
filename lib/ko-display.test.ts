import { describe, expect, it } from "vitest";
import {
  koreanizePayload,
  koreanizePublicText,
  METRICS_TABLE_HEADER,
} from "@/lib/ko-display";

describe("koreanizePublicText", () => {
  it("turns screenshot metric keys into Korean", () => {
    expect(
      koreanizePublicText("월 현금흐름은 안정적(cash_net 8,015~9,367만원)"),
    ).toBe("월 현금흐름은 안정적(순현금 8,015~9,367만원)");
    expect(koreanizePublicText("inflow_ad 2026-01 206(최고)")).toBe(
      "검색광고 유입 2026-01 206(최고)",
    );
    expect(koreanizePublicText("per_doctor 2026-03 4명")).toBe(
      "의사 1인당 수술 2026-03 4명",
    );
    expect(koreanizePublicText("cataract 2026-04 16건")).toBe(
      "백내장 2026-04 16건",
    );
    expect(koreanizePublicText("특히 ad-consult-cash_net, 채널별로")).toBe(
      "특히 광고-상담-순현금, 채널별로",
    );
    expect(koreanizePublicText("nat_dom 기준 운영")).toBe(
      "국내 환자 비중 기준 운영",
    );
  });

  it("softens business acronyms and surgery English", () => {
    expect(koreanizePublicText("마케팅 채널별 CAC와 LTV 미측정")).toBe(
      "마케팅 채널별 유치비용과 생애가치 미측정",
    );
    expect(koreanizePublicText("광고 투자 ROI 판단 불가")).toBe(
      "광고 투자 성과 판단 불가",
    );
    expect(koreanizePublicText("월별 수술건수 변동성 큼(LASIK 14~28건)")).toBe(
      "월별 수술건수 변동성 큼(라식 14~28건)",
    );
    expect(koreanizePublicText("품질·마케팅 효율·cash_net 트레이드오프")).toBe(
      "품질·마케팅 효율·순현금 상충",
    );
  });

  it("maps dotted schema paths used in evidence chips", () => {
    expect(koreanizePublicText("inflow.search_ad 2026-07")).toBe(
      "검색광고 유입 2026-07",
    );
    expect(koreanizePublicText("revenue_mix.cataract 2026-07")).toBe(
      "백내장 매출 비중 2026-07",
    );
  });

  it("koreanizes a turn payload without touching JSON key names", () => {
    const out = koreanizePayload({
      position: "cash_net이 줄면 보류",
      evidence: ["inflow_ad 2026-01"],
      risks: ["CAC 미측정"],
      needs_data: ["채널별 LTV"],
      objection: "ROI 근거 없음",
      changed: "유지: cash_net 우선",
    });
    expect(out.position).toBe("순현금이 줄면 보류");
    expect(out.evidence).toEqual(["검색광고 유입 2026-01"]);
    expect(out.risks).toEqual(["유치비용 미측정"]);
    expect(out.needs_data).toEqual(["채널별 생애가치"]);
    expect(out.objection).toBe("투자성과 근거 없음");
    expect(out.changed).toBe("유지: 순현금 우선");
  });
});

describe("metrics table header", () => {
  it("uses Korean column names, not English keys", () => {
    expect(METRICS_TABLE_HEADER).toMatch(/순현금/);
    expect(METRICS_TABLE_HEADER).not.toMatch(/cash_net/);
    expect(METRICS_TABLE_HEADER).not.toMatch(/inflow_ad/);
  });
});
