import { describe, expect, it } from "vitest";
import { loadMetrics } from "@/lib/prompt";
import {
  tableDocumentsFromMetrics,
  type TableBarSeries,
  type TableGridSeries,
  type TableLineSeries,
  type TableNoteSeries,
  type TablePieSeries,
} from "@/lib/table-charts";

describe("tableDocumentsFromMetrics", () => {
  const docs = tableDocumentsFromMetrics(loadMetrics());

  it("lays out the six 03 table papers from bundled metrics", () => {
    expect(docs.map((doc) => doc.id)).toEqual([
      "pnl",
      "cost",
      "outpatient",
      "dept",
      "marketing",
      "staff",
    ]);
    expect(docs.map((doc) => doc.title)).toEqual([
      "손익계산서",
      "비용 구조 분석",
      "외래 환자 추이",
      "진료과별 현황",
      "마케팅 채널 성과",
      "인력·장비 계획",
    ]);
  });

  it("uses the last six months of net cash for the P&L bars", () => {
    const pnl = docs[0] as TableBarSeries;
    expect(pnl.kind).toBe("bar");
    expect(pnl.labels).toEqual(["2월", "3월", "4월", "5월", "6월", "7월"]);
    expect(pnl.values.at(-1)).toBe(3252);
    expect(pnl.values).toHaveLength(6);
  });

  it("reads the latest revenue mix as the cost pie", () => {
    const cost = docs[1] as TablePieSeries;
    expect(cost.kind).toBe("pie");
    expect(cost.slices.map((slice) => slice.label)).toEqual([
      "시력교정",
      "백내장",
      "기타",
    ]);
    expect(cost.slices.map((slice) => slice.value)).toEqual([0.62, 0.31, 0.07]);
  });

  it("plots twelve months of surgery volume as the outpatient line", () => {
    const line = docs[2] as TableLineSeries;
    expect(line.kind).toBe("line");
    expect(line.values).toHaveLength(12);
    expect(line.values.at(-1)).toBe(813);
    expect(line.labels.at(-1)).toBe("7월");
  });

  it("falls back to surgery mix when demographics are missing", () => {
    const dept = docs[3] as TableGridSeries;
    expect(dept.kind).toBe("grid");
    expect(dept.rows).toEqual([
      { label: "라식", value: 210 },
      { label: "스마일", value: 340 },
      { label: "ICL", value: 95 },
      { label: "백내장", value: 168 },
    ]);
  });

  it("uses department shares when demographics exist", () => {
    const withDept = tableDocumentsFromMetrics({
      ...loadMetrics(),
      demographics: {
        gender: { male: 0.4, female: 0.6 },
        age_bands: [{ label: "40대", share: 1 }],
        regions: [{ label: "서울", share: 1 }],
        departments: [
          { label: "안과", share: 0.41 },
          { label: "내과", share: 0.22 },
          { label: "정형외과", share: 0.19 },
          { label: "소아과", share: 0.18 },
        ],
      },
    });
    const dept = withDept[3] as TableGridSeries;
    expect(dept.rows.map((row) => row.label)).toEqual([
      "안과",
      "내과",
      "정형외과",
      "소아과",
    ]);
  });

  it("maps the latest inflow channels and staffing note", () => {
    const marketing = docs[4] as TablePieSeries;
    expect(marketing.slices[0]).toEqual({ label: "검색광고", value: 820 });
    const staff = docs[5] as TableNoteSeries;
    expect(staff.kind).toBe("note");
    expect(staff.lines[0]).toContain("4명");
    expect(staff.lines[1]).toContain("203");
  });
});
