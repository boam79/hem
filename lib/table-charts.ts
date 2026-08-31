import type { Metrics } from "@/lib/schema";

export type TableDocId =
  | "pnl"
  | "cost"
  | "outpatient"
  | "dept"
  | "marketing"
  | "staff";

export type TableBarSeries = {
  kind: "bar";
  id: TableDocId;
  title: string;
  labels: string[];
  values: number[];
};

export type TablePieSlice = { label: string; value: number };

export type TablePieSeries = {
  kind: "pie";
  id: TableDocId;
  title: string;
  slices: TablePieSlice[];
};

export type TableLineSeries = {
  kind: "line";
  id: TableDocId;
  title: string;
  labels: string[];
  values: number[];
};

export type TableGridSeries = {
  kind: "grid";
  id: TableDocId;
  title: string;
  rows: { label: string; value: number }[];
};

export type TableNoteSeries = {
  kind: "note";
  id: TableDocId;
  title: string;
  lines: string[];
};

export type TableDocument =
  | TableBarSeries
  | TablePieSeries
  | TableLineSeries
  | TableGridSeries
  | TableNoteSeries;

function last<T>(rows: T[]): T {
  return rows[rows.length - 1];
}

function monthLabel(month: string): string {
  return `${Number(month.slice(5))}월`;
}

function surgeryTotal(row: Metrics["monthly"][number]): number {
  const { lasik, smile, icl, cataract } = row.surgeries;
  return lasik + smile + icl + cataract;
}

export function tableDocumentsFromMetrics(metrics: Metrics): TableDocument[] {
  const { monthly } = metrics;
  const tail = monthly.slice(-6);
  const latest = last(monthly);
  const deptRows =
    metrics.demographics?.departments &&
    metrics.demographics.departments.length > 0
      ? metrics.demographics.departments.slice(0, 4).map((row) => ({
          label: row.label,
          value: row.share,
        }))
      : [
          { label: "라식", value: latest.surgeries.lasik },
          { label: "스마일", value: latest.surgeries.smile },
          { label: "ICL", value: latest.surgeries.icl },
          { label: "백내장", value: latest.surgeries.cataract },
        ];

  return [
    {
      kind: "bar",
      id: "pnl",
      title: "손익계산서",
      labels: tail.map((row) => monthLabel(row.month)),
      values: tail.map((row) => row.cashflow.net_man),
    },
    {
      kind: "pie",
      id: "cost",
      title: "비용 구조 분석",
      slices: [
        { label: "시력교정", value: latest.revenue_mix.refractive },
        { label: "백내장", value: latest.revenue_mix.cataract },
        { label: "기타", value: latest.revenue_mix.other },
      ],
    },
    {
      kind: "line",
      id: "outpatient",
      title: "외래 환자 추이",
      labels: monthly.map((row) => monthLabel(row.month)),
      values: monthly.map(surgeryTotal),
    },
    {
      kind: "grid",
      id: "dept",
      title: "진료과별 현황",
      rows: deptRows,
    },
    {
      kind: "pie",
      id: "marketing",
      title: "마케팅 채널 성과",
      slices: [
        { label: "검색광고", value: latest.inflow.search_ad },
        { label: "소셜", value: latest.inflow.social },
        { label: "소개", value: latest.inflow.referral },
        { label: "해외", value: latest.inflow.overseas_agency },
      ],
    },
    {
      kind: "note",
      id: "staff",
      title: "인력·장비 계획",
      lines: [
        `전문의 ${metrics.hospital.doctors}명`,
        `의사 1인당 수술 ${latest.per_doctor_surgeries}건`,
      ],
    },
  ];
}
