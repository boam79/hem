import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import spec from "@/data/patient-dummy-spec.json";
import {
  aggregatePatientVisits,
  isPatientHeader,
  mapPatientHeader,
  mapProcedureToSurgery,
  monthsInPeriod,
  parsePatientRow,
} from "@/lib/patient-visits";
import {
  MetricsParseError,
  parseMetricsCsv,
  parseMetricsUpload,
} from "@/lib/metrics-file";
import { MAX_METRICS_UPLOAD_BYTES } from "@/config/limits";
import { metricsToMarkdownTable } from "@/lib/prompt";
import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";
import { estimateTokens } from "@/lib/tokens";

const HEADER =
  "진료일,진료과,시술,성별,나이대,지역,국적,유입경로,매출_만원,상담,수술전환";

function monthVisit(month: string, extra: string): string {
  return `${month}-10,${extra}`;
}

function twelveMonthPatientCsv(): string {
  const months = monthsInPeriod("2025-08", "2026-07");
  const meta = [
    "비고,테스트 환자더미",
    "병원명,포레스트병원(가상)",
    "병원유형,안과 중심 종합병원(가상)",
    "의사수,12",
    "시작월,2025-08",
    "종료월,2026-07",
  ];
  const rows: string[] = [];
  months.forEach((m, i) => {
    rows.push(
      monthVisit(
        m,
        `안과,백내장,여,60대,서울,국내,검색광고,${180 + i},1,1`,
      ),
    );
    rows.push(
      monthVisit(m, `안과,라식,남,30대,경기,국내,소셜,150,1,1`),
    );
  });
  for (const dept of spec.departments) {
    rows.push(`2025-08-12,${dept},외래,남,40대,부산,국내,소개,60,1,1`);
  }
  for (const region of spec.regions) {
    rows.push(`2025-09-05,내과,외래,여,50대,${region},국내,검색광고,40,1,1`);
  }
  for (const age of spec.ageBands) {
    rows.push(`2025-10-08,피부과,외래,남,${age},인천,국내,소셜,35,1,1`);
  }
  rows.push(`2026-01-03,안과,스마일,여,20대,서울,중국,해외에이전시,240,1,1`);
  rows.push(`2026-01-04,안과,ICL,남,20대,제주,일본,소개,260,1,1`);
  return [...meta, "", HEADER, ...rows].join("\n") + "\n";
}

describe("patient visit aggregation", () => {
  it("detects korean patient headers", () => {
    expect(isPatientHeader(HEADER.split(","))).toBe(true);
    expect(isPatientHeader(["month", "lasik", "smile"])).toBe(false);
  });

  it("maps eye procedures onto the four surgery buckets", () => {
    expect(mapProcedureToSurgery("라식", "안과")).toBe("lasik");
    expect(mapProcedureToSurgery("라섹", "안과")).toBe("lasik");
    expect(mapProcedureToSurgery("스마일", "안과")).toBe("smile");
    expect(mapProcedureToSurgery("ICL", "안과")).toBe("icl");
    expect(mapProcedureToSurgery("백내장", "안과")).toBe("cataract");
    expect(mapProcedureToSurgery("외래", "내과")).toBe("other");
  });

  it("builds 12 months and demographics from patient rows", () => {
    const header = mapPatientHeader(HEADER.split(","));
    expect(header).not.toBeNull();
    const csv = twelveMonthPatientCsv();
    const parsed = parseMetricsCsv(csv);
    expect(parsed.hospital.name).toBe("포레스트병원(가상)");
    expect(parsed.monthly).toHaveLength(12);
    expect(parsed.monthly[0]?.surgeries.cataract).toBeGreaterThan(0);
    expect(parsed.monthly[0]?.surgeries.lasik).toBeGreaterThan(0);
    expect(parsed.demographics?.gender.female).toBeGreaterThan(0);
    expect(parsed.demographics?.departments.some((d) => d.label === "안과")).toBe(
      true,
    );
    const table = metricsToMarkdownTable(parsed);
    expect(table).toMatch(/인구통계/);
    expect(estimateTokens(table)).toBeLessThanOrEqual(METRICS_TABLE_TOKEN_LIMIT);
  });

  it("clamps consult rate into the schema band", () => {
    const visits = monthsInPeriod("2025-08", "2026-07").map((m) =>
      parsePatientRow(mapPatientHeader(HEADER.split(","))!, [
        `${m}-01`,
        "내과",
        "외래",
        "남",
        "40대",
        "서울",
        "국내",
        "검색광고",
        "50",
        "1",
        "0",
      ]),
    );
    const metrics = aggregatePatientVisits(
      {
        hospital_name: "클램프병원",
        hospital_type: "가상",
        doctors: "4",
        period_from: "2025-08",
        period_to: "2026-07",
      },
      visits,
    );
    for (const row of metrics.monthly) {
      expect(row.consult_to_surgery_rate).toBeGreaterThanOrEqual(0.55);
      expect(row.consult_to_surgery_rate).toBeLessThanOrEqual(0.7);
    }
  });
});

describe("monthly csv extra columns", () => {
  it("ignores unknown columns on the existing monthly format", () => {
    const base = readFileSync(
      resolve(process.cwd(), "public/dummy/patient-and-cashflow.csv"),
      "utf8",
    );
    const out = base.split("\n").map((line) => {
      if (line.startsWith("month,")) return `${line},extra`;
      if (/^\d{4}-\d{2},/.test(line)) return `${line},0`;
      return line;
    });
    const parsed = parseMetricsCsv(out.join("\n"));
    expect(parsed.monthly[0]?.surgeries.lasik).toBe(99);
  });
});

describe("upload size cap", () => {
  it("rejects a buffer over 400KB", async () => {
    const buf = Buffer.alloc(MAX_METRICS_UPLOAD_BYTES + 1, 97);
    await expect(parseMetricsUpload(buf, "huge.csv")).rejects.toBeInstanceOf(
      MetricsParseError,
    );
    await expect(parseMetricsUpload(buf, "huge.csv")).rejects.toThrow(/400KB/);
  });
});

describe("generated full dummy", () => {
  const monthlyCsvPath = resolve(
    process.cwd(),
    "public/dummy/hospital-patients-full.csv",
  );
  const visitsCsvPath = resolve(
    process.cwd(),
    "public/dummy/hospital-patients-visits.csv",
  );
  const xlsxPath = resolve(
    process.cwd(),
    "public/dummy/hospital-patients-full.xlsx",
  );

  it("monthly csv has a month header the live parser accepts", () => {
    expect(existsSync(monthlyCsvPath)).toBe(true);
    const text = readFileSync(monthlyCsvPath, "utf8");
    expect(text).toMatch(/^hospital_name,포레스트병원\(가상\)/m);
    expect(text).toMatch(/^month,lasik,smile,icl,cataract,/m);
    expect(statSync(monthlyCsvPath).size).toBeLessThanOrEqual(
      MAX_METRICS_UPLOAD_BYTES,
    );
  });

  it("visits csv stays under 400KB and covers all spec dimensions", () => {
    expect(existsSync(visitsCsvPath)).toBe(true);
    const bytes = statSync(visitsCsvPath).size;
    expect(bytes).toBeGreaterThan(200_000);
    expect(bytes).toBeLessThanOrEqual(MAX_METRICS_UPLOAD_BYTES);
    const text = readFileSync(visitsCsvPath, "utf8");
    for (const dept of spec.departments) {
      expect(text).toContain(`,${dept},`);
    }
    for (const gender of spec.genders) {
      expect(text).toContain(`,${gender},`);
    }
    for (const age of spec.ageBands) {
      expect(text).toContain(`,${age},`);
    }
    for (const region of spec.regions) {
      expect(text).toContain(`,${region},`);
    }
    for (const proc of spec.eyeProcedures) {
      expect(text).toContain(`,${proc},`);
    }
  });

  it("parses the monthly dummy csv into 12 months", async () => {
    const parsed = await parseMetricsUpload(
      readFileSync(monthlyCsvPath),
      "hospital-patients-full.csv",
    );
    expect(parsed.hospital.name).toBe("포레스트병원(가상)");
    expect(parsed.monthly).toHaveLength(12);
    expect(parsed.monthly.some((m) => m.surgeries.cataract > 0)).toBe(true);
    expect(
      estimateTokens(metricsToMarkdownTable(parsed)),
    ).toBeLessThanOrEqual(METRICS_TABLE_TOKEN_LIMIT);
  });

  it("parses the full dummy xlsx under 400KB", async () => {
    expect(existsSync(xlsxPath)).toBe(true);
    expect(statSync(xlsxPath).size).toBeLessThanOrEqual(MAX_METRICS_UPLOAD_BYTES);
    const parsed = await parseMetricsUpload(
      readFileSync(xlsxPath),
      "hospital-patients-full.xlsx",
    );
    expect(parsed.hospital.name).toBe("포레스트병원(가상)");
    expect(parsed.monthly).toHaveLength(12);
  });
});
