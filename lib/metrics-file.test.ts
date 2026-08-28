import { describe, expect, it } from "vitest";
import { MAX_METRICS_UPLOAD_BYTES } from "@/config/limits";
import { loadMetrics, metricsToMarkdownTable } from "@/lib/prompt";
import {
  MetricsParseError,
  parseMetricsCsv,
  parseMetricsUpload,
  serializeMetricsCsv,
  serializeMetricsXlsx,
} from "@/lib/metrics-file";
import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";
import { estimateTokens } from "@/lib/tokens";

function dummyMetrics() {
  const base = loadMetrics();
  return {
    ...base,
    _note: "업로드 더미. 재무흐름(현금)과 환자통계(수술·유입). 실제 병원 아님.",
    hospital: {
      ...base.hospital,
      name: "업로드안과(가상)",
    },
    monthly: base.monthly.map((row, i) => ({
      ...row,
      surgeries: {
        ...row.surgeries,
        lasik: i === 0 ? 99 : row.surgeries.lasik,
      },
      cashflow: {
        in_man: row.cashflow.in_man + 50,
        out_man: row.cashflow.out_man + 20,
        net_man: row.cashflow.net_man + 30,
      },
    })),
  };
}

describe("metrics cashflow table", () => {
  it("bundled metrics stay under 1000 tokens with cashflow columns", () => {
    const table = metricsToMarkdownTable(loadMetrics());
    expect(table).toMatch(/cash_net/);
    expect(estimateTokens(table)).toBeLessThanOrEqual(METRICS_TABLE_TOKEN_LIMIT);
  });
});

describe("metrics file parse", () => {
  it("round-trips csv for dummy cashflow and patient stats", () => {
    const dummy = dummyMetrics();
    const csv = serializeMetricsCsv(dummy);
    const parsed = parseMetricsCsv(csv);
    expect(parsed.hospital.name).toBe("업로드안과(가상)");
    expect(parsed.monthly[0]?.surgeries.lasik).toBe(99);
    expect(parsed.monthly[0]?.cashflow.in_man).toBe(dummy.monthly[0]?.cashflow.in_man);
    expect(parsed.monthly).toHaveLength(12);
  });

  it("round-trips xlsx", async () => {
    const dummy = dummyMetrics();
    const xlsx = await serializeMetricsXlsx(dummy);
    const parsed = await parseMetricsUpload(xlsx, "patient-and-cashflow.xlsx");
    expect(parsed.hospital.name).toBe("업로드안과(가상)");
    expect(parsed.monthly[0]?.surgeries.lasik).toBe(99);
  });

  it("rejects empty and unknown extensions", async () => {
    await expect(parseMetricsUpload(Buffer.from(""), "a.csv")).rejects.toBeInstanceOf(
      MetricsParseError,
    );
    await expect(
      parseMetricsUpload(Buffer.from("x"), "a.json"),
    ).rejects.toThrow(/csv 또는 xlsx/);
    expect(MAX_METRICS_UPLOAD_BYTES).toBe(400_000);
  });

  it("rejects csv without month header", () => {
    expect(() => parseMetricsCsv("hospital_name,테스트")).toThrow(/month/);
  });
});
