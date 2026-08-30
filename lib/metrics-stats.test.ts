import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DATA_REVIEW_AGENDA,
  canStartDataReview,
  isAgendaValid,
} from "@/lib/agenda";
import { AGENDA_MAX, AGENDA_MIN } from "@/config/limits";
import { SessionCreateSchema } from "@/lib/schema";
import { loadMetrics } from "@/lib/prompt";
import { parseMetricsCsv } from "@/lib/metrics-file";
import { parseUploadedMetrics, summarizeMetrics } from "@/lib/metrics-stats";

describe("data review agenda", () => {
  it("is a valid 10–200 character agenda for a session", () => {
    const n = DATA_REVIEW_AGENDA.trim().length;
    expect(n).toBeGreaterThanOrEqual(AGENDA_MIN);
    expect(n).toBeLessThanOrEqual(AGENDA_MAX);
    expect(isAgendaValid(DATA_REVIEW_AGENDA)).toBe(true);
    const parsed = SessionCreateSchema.safeParse({
      agenda: DATA_REVIEW_AGENDA,
      category: "marketing",
    });
    expect(parsed.success).toBe(true);
  });

  it("blocks data review until a file is uploaded", () => {
    expect(canStartDataReview(false)).toBe(false);
    expect(canStartDataReview(true)).toBe(true);
  });
});

describe("metrics stats summary", () => {
  it("builds 12 rows and surgery/cash totals from bundled metrics", () => {
    const metrics = loadMetrics();
    const summary = summarizeMetrics(metrics);
    expect(summary.hospitalName).toBe("S안과(가상)");
    expect(summary.periodFrom).toBe("2025-08");
    expect(summary.periodTo).toBe("2026-07");
    expect(summary.doctors).toBe(4);
    expect(summary.rows).toHaveLength(12);
    expect(summary.rows[0]?.month).toBe("2025-08");
    const surgeryTotal = metrics.monthly.reduce(
      (sum, row) =>
        sum +
        row.surgeries.lasik +
        row.surgeries.smile +
        row.surgeries.icl +
        row.surgeries.cataract,
      0,
    );
    const cashNetTotal = metrics.monthly.reduce(
      (sum, row) => sum + row.cashflow.net_man,
      0,
    );
    expect(summary.surgeryTotal).toBe(surgeryTotal);
    expect(summary.cashNetTotal).toBe(cashNetTotal);
    expect(summary.surgeryTotal).toBeGreaterThan(0);
  });

  it("summarizes the dummy monthly csv hospital name", () => {
    const csv = readFileSync(
      resolve(process.cwd(), "public/dummy/patient-and-cashflow.csv"),
      "utf8",
    );
    const metrics = parseMetricsCsv(csv);
    const summary = summarizeMetrics(metrics);
    expect(summary.hospitalName).toBe("업로드안과(가상)");
    expect(summary.rows).toHaveLength(12);
    expect(summary.rows[0]?.lasik).toBe(99);
  });

  it("returns null for non-metrics payloads", () => {
    expect(parseUploadedMetrics(null)).toBeNull();
    expect(parseUploadedMetrics({ hospital: "x" })).toBeNull();
  });
});
