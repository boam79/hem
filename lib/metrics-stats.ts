import { MetricsSchema, type Metrics } from "@/lib/schema";

export type MetricsStatRow = {
  month: string;
  lasik: number;
  smile: number;
  icl: number;
  cataract: number;
  cashIn: number;
  cashOut: number;
  cashNet: number;
};

export type MetricsStatsSummary = {
  hospitalName: string;
  periodFrom: string;
  periodTo: string;
  doctors: number;
  rows: MetricsStatRow[];
  surgeryTotal: number;
  cashNetTotal: number;
};

export function summarizeMetrics(metrics: Metrics): MetricsStatsSummary {
  const rows: MetricsStatRow[] = metrics.monthly.map((row) => ({
    month: row.month,
    lasik: row.surgeries.lasik,
    smile: row.surgeries.smile,
    icl: row.surgeries.icl,
    cataract: row.surgeries.cataract,
    cashIn: row.cashflow.in_man,
    cashOut: row.cashflow.out_man,
    cashNet: row.cashflow.net_man,
  }));
  const surgeryTotal = rows.reduce(
    (sum, row) => sum + row.lasik + row.smile + row.icl + row.cataract,
    0,
  );
  const cashNetTotal = rows.reduce((sum, row) => sum + row.cashNet, 0);
  return {
    hospitalName: metrics.hospital.name,
    periodFrom: metrics.period.from,
    periodTo: metrics.period.to,
    doctors: metrics.hospital.doctors,
    rows,
    surgeryTotal,
    cashNetTotal,
  };
}

export function parseUploadedMetrics(raw: unknown): Metrics | null {
  const parsed = MetricsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
