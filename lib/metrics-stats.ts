import { MetricsSchema, type Metrics } from "@/lib/schema";
import { demographicsLine } from "@/lib/patient-visits";

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

export type ExtremeMonth = {
  label: string;
  month: string;
  value: number;
};

export type MetricsStatsSummary = {
  hospitalName: string;
  periodFrom: string;
  periodTo: string;
  doctors: number;
  rows: MetricsStatRow[];
  surgeryTotal: number;
  cashNetTotal: number;
  lastInflow: {
    searchAd: number;
    social: number;
    referral: number;
    overseas: number;
  } | null;
  lastNationality: {
    domestic: number;
    china: number;
    japan: number;
  } | null;
  demographics: string | null;
  extremes: ExtremeMonth[];
};

function extreme(
  metrics: Metrics,
  label: string,
  pick: (row: Metrics["monthly"][number]) => number,
  kind: "max" | "min",
): ExtremeMonth | null {
  if (metrics.monthly.length === 0) return null;
  const ranked = [...metrics.monthly].sort((a, b) =>
    kind === "max" ? pick(b) - pick(a) : pick(a) - pick(b),
  );
  const row = ranked[0];
  if (!row) return null;
  return { label, month: row.month, value: pick(row) };
}

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
  const last = metrics.monthly[metrics.monthly.length - 1] ?? null;
  const cashMax = extreme(metrics, "순현금 최고", (row) => row.cashflow.net_man, "max");
  const cashMin = extreme(metrics, "순현금 최저", (row) => row.cashflow.net_man, "min");
  const searchMax = extreme(
    metrics,
    "검색광고 유입 최고",
    (row) => row.inflow.search_ad,
    "max",
  );
  const perDocMax = extreme(
    metrics,
    "의사 1인당 수술 최고",
    (row) => row.per_doctor_surgeries,
    "max",
  );
  return {
    hospitalName: metrics.hospital.name,
    periodFrom: metrics.period.from,
    periodTo: metrics.period.to,
    doctors: metrics.hospital.doctors,
    rows,
    surgeryTotal,
    cashNetTotal,
    lastInflow: last
      ? {
          searchAd: last.inflow.search_ad,
          social: last.inflow.social,
          referral: last.inflow.referral,
          overseas: last.inflow.overseas_agency,
        }
      : null,
    lastNationality: last
      ? {
          domestic: last.nationality_mix.domestic,
          china: last.nationality_mix.china,
          japan: last.nationality_mix.japan,
        }
      : null,
    demographics: demographicsLine(metrics),
    extremes: [cashMax, cashMin, searchMax, perDocMax].filter(
      (row): row is ExtremeMonth => Boolean(row),
    ),
  };
}

export function parseUploadedMetrics(raw: unknown): Metrics | null {
  const parsed = MetricsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
