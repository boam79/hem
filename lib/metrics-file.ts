import ExcelJS from "exceljs";
import { MAX_METRICS_UPLOAD_BYTES } from "@/config/limits";
import { MetricsSchema, type Metrics } from "@/lib/schema";

const MONTH_HEADER = [
  "month",
  "lasik",
  "smile",
  "icl",
  "cataract",
  "per_doctor",
  "rev_ref",
  "rev_cat",
  "rev_other",
  "inflow_ad",
  "inflow_social",
  "inflow_ref",
  "inflow_ov",
  "nat_dom",
  "nat_cn",
  "nat_jp",
  "nat_other",
  "consult",
  "cash_in",
  "cash_out",
  "cash_net",
] as const;

const HEADER_ALIASES: Record<string, (typeof MONTH_HEADER)[number]> = {
  month: "month",
  월: "month",
  lasik: "lasik",
  라식: "lasik",
  smile: "smile",
  스마일: "smile",
  icl: "icl",
  cataract: "cataract",
  백내장: "cataract",
  per_doctor: "per_doctor",
  의사당수술: "per_doctor",
  rev_ref: "rev_ref",
  굴절매출비중: "rev_ref",
  rev_cat: "rev_cat",
  백내장매출비중: "rev_cat",
  rev_other: "rev_other",
  기타매출비중: "rev_other",
  inflow_ad: "inflow_ad",
  검색광고유입: "inflow_ad",
  inflow_social: "inflow_social",
  소셜유입: "inflow_social",
  inflow_ref: "inflow_ref",
  소개유입: "inflow_ref",
  inflow_ov: "inflow_ov",
  해외에이전시유입: "inflow_ov",
  nat_dom: "nat_dom",
  국내비중: "nat_dom",
  nat_cn: "nat_cn",
  중국비중: "nat_cn",
  nat_jp: "nat_jp",
  일본비중: "nat_jp",
  nat_other: "nat_other",
  기타국적비중: "nat_other",
  consult: "consult",
  상담전환율: "consult",
  cash_in: "cash_in",
  현금유입_만원: "cash_in",
  cash_out: "cash_out",
  현금유출_만원: "cash_out",
  cash_net: "cash_net",
  순현금_만원: "cash_net",
};

export class MetricsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetricsParseError";
  }
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "")
    .trim()
    .replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new MetricsParseError(`숫자가 아닙니다: ${String(v)}`);
  }
  return n;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseMetaKey(key: string): string {
  const k = key.trim().toLowerCase();
  const map: Record<string, string> = {
    _note: "_note",
    비고: "_note",
    hospital_name: "hospital_name",
    병원명: "hospital_name",
    hospital_type: "hospital_type",
    병원유형: "hospital_type",
    doctors: "doctors",
    의사수: "doctors",
    period_from: "period_from",
    시작월: "period_from",
    period_to: "period_to",
    종료월: "period_to",
  };
  return map[k] ?? k;
}

function monthlyFromRow(
  header: (typeof MONTH_HEADER)[number][],
  values: string[],
): Metrics["monthly"][number] {
  const get = (name: (typeof MONTH_HEADER)[number]) => {
    const i = header.indexOf(name);
    if (i < 0) throw new MetricsParseError(`열 없음: ${name}`);
    return values[i];
  };
  return {
    month: String(get("month")),
    surgeries: {
      lasik: num(get("lasik")),
      smile: num(get("smile")),
      icl: num(get("icl")),
      cataract: num(get("cataract")),
    },
    per_doctor_surgeries: num(get("per_doctor")),
    revenue_mix: {
      refractive: num(get("rev_ref")),
      cataract: num(get("rev_cat")),
      other: num(get("rev_other")),
    },
    inflow: {
      search_ad: num(get("inflow_ad")),
      social: num(get("inflow_social")),
      referral: num(get("inflow_ref")),
      overseas_agency: num(get("inflow_ov")),
    },
    nationality_mix: {
      domestic: num(get("nat_dom")),
      china: num(get("nat_cn")),
      japan: num(get("nat_jp")),
      other: num(get("nat_other")),
    },
    consult_to_surgery_rate: num(get("consult")),
    cashflow: {
      in_man: num(get("cash_in")),
      out_man: num(get("cash_out")),
      net_man: num(get("cash_net")),
    },
  };
}

function mapHeader(cells: string[]): (typeof MONTH_HEADER)[number][] {
  return cells.map((raw) => {
    const key = raw.trim().toLowerCase();
    const mapped = HEADER_ALIASES[key];
    if (!mapped) {
      throw new MetricsParseError(`알 수 없는 열: ${raw}`);
    }
    return mapped;
  });
}

function finishMetrics(meta: Record<string, string>, monthly: Metrics["monthly"]): Metrics {
  const parsed = MetricsSchema.safeParse({
    _note: meta._note || "업로드 집계. 실제 병원 수치와의 유사성 없음.",
    hospital: {
      name: meta.hospital_name,
      type: meta.hospital_type,
      doctors: num(meta.doctors),
    },
    period: {
      from: meta.period_from,
      to: meta.period_to,
    },
    monthly,
  });
  if (!parsed.success) {
    throw new MetricsParseError(
      parsed.error.issues[0]?.message || "지표 스키마가 맞지 않습니다.",
    );
  }
  return parsed.data;
}

export function parseMetricsCsv(text: string): Metrics {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() && !l.trim().startsWith("#"));
  const meta: Record<string, string> = {};
  let header: (typeof MONTH_HEADER)[number][] | null = null;
  const monthly: Metrics["monthly"] = [];
  for (const line of lines) {
    const cols = splitCsvLine(line);
    const first = (cols[0] ?? "").trim().toLowerCase();
    if (!header && (first === "month" || first === "월")) {
      header = mapHeader(cols);
      continue;
    }
    if (!header) {
      if (cols.length >= 2) {
        meta[parseMetaKey(cols[0])] = cols.slice(1).join(",").trim();
      }
      continue;
    }
    monthly.push(monthlyFromRow(header, cols));
  }
  if (!header) {
    throw new MetricsParseError("month 헤더 행이 없습니다.");
  }
  return finishMetrics(meta, monthly);
}

function monthlyFromKeyed(
  row: Record<string, unknown>,
): Metrics["monthly"][number] {
  const get = (name: (typeof MONTH_HEADER)[number]) => row[name];
  return monthlyFromRow(
    [...MONTH_HEADER],
    MONTH_HEADER.map((h) => String(get(h) ?? "")),
  );
}

export async function parseMetricsXlsx(buffer: Buffer): Promise<Metrics> {
  const wb = new ExcelJS.Workbook();
  // exceljs typings accept Buffer via load
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const hospital = wb.getWorksheet("hospital") ?? wb.getWorksheet("병원");
  const monthlySheet = wb.getWorksheet("monthly") ?? wb.getWorksheet("월별") ?? wb.worksheets[0];
  if (!monthlySheet) {
    throw new MetricsParseError("엑셀에 시트가 없습니다.");
  }

  const meta: Record<string, string> = {};
  if (hospital && hospital !== monthlySheet) {
    hospital.eachRow((row) => {
      const key = String(row.getCell(1).value ?? "").trim();
      const value = String(row.getCell(2).value ?? "").trim();
      if (key) meta[parseMetaKey(key)] = value;
    });
  }

  const rows: string[][] = [];
  monthlySheet.eachRow((row) => {
    const vals: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      vals[col - 1] = String(cell.value ?? "").trim();
    });
    if (vals.some((v) => v)) rows.push(vals);
  });

  let header: (typeof MONTH_HEADER)[number][] | null = null;
  const monthly: Metrics["monthly"] = [];
  for (const cols of rows) {
    const first = (cols[0] ?? "").trim().toLowerCase();
    if (!header && (first === "month" || first === "월")) {
      header = mapHeader(cols);
      continue;
    }
    if (!header) {
      if (!hospital && cols.length >= 2) {
        meta[parseMetaKey(cols[0])] = cols.slice(1).join(",").trim();
      }
      continue;
    }
    const keyed: Record<string, string> = {};
    header.forEach((h, i) => {
      keyed[h] = cols[i] ?? "";
    });
    monthly.push(monthlyFromKeyed(keyed));
  }
  if (!header) {
    throw new MetricsParseError("month 헤더 행이 없습니다.");
  }
  return finishMetrics(meta, monthly);
}

export function serializeMetricsCsv(metrics: Metrics): string {
  const meta = [
    `_note,${csvEscape(metrics._note)}`,
    `hospital_name,${csvEscape(metrics.hospital.name)}`,
    `hospital_type,${csvEscape(metrics.hospital.type)}`,
    `doctors,${metrics.hospital.doctors}`,
    `period_from,${metrics.period.from}`,
    `period_to,${metrics.period.to}`,
  ];
  const header = MONTH_HEADER.join(",");
  const body = metrics.monthly.map((m) =>
    [
      m.month,
      m.surgeries.lasik,
      m.surgeries.smile,
      m.surgeries.icl,
      m.surgeries.cataract,
      m.per_doctor_surgeries,
      m.revenue_mix.refractive,
      m.revenue_mix.cataract,
      m.revenue_mix.other,
      m.inflow.search_ad,
      m.inflow.social,
      m.inflow.referral,
      m.inflow.overseas_agency,
      m.nationality_mix.domestic,
      m.nationality_mix.china,
      m.nationality_mix.japan,
      m.nationality_mix.other,
      m.consult_to_surgery_rate,
      m.cashflow.in_man,
      m.cashflow.out_man,
      m.cashflow.net_man,
    ].join(","),
  );
  return [...meta, "", header, ...body].join("\n") + "\n";
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function serializeMetricsXlsx(metrics: Metrics): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const hospital = wb.addWorksheet("hospital");
  hospital.addRow(["_note", metrics._note]);
  hospital.addRow(["hospital_name", metrics.hospital.name]);
  hospital.addRow(["hospital_type", metrics.hospital.type]);
  hospital.addRow(["doctors", metrics.hospital.doctors]);
  hospital.addRow(["period_from", metrics.period.from]);
  hospital.addRow(["period_to", metrics.period.to]);

  const monthly = wb.addWorksheet("monthly");
  monthly.addRow([...MONTH_HEADER]);
  for (const m of metrics.monthly) {
    monthly.addRow([
      m.month,
      m.surgeries.lasik,
      m.surgeries.smile,
      m.surgeries.icl,
      m.surgeries.cataract,
      m.per_doctor_surgeries,
      m.revenue_mix.refractive,
      m.revenue_mix.cataract,
      m.revenue_mix.other,
      m.inflow.search_ad,
      m.inflow.social,
      m.inflow.referral,
      m.inflow.overseas_agency,
      m.nationality_mix.domestic,
      m.nationality_mix.china,
      m.nationality_mix.japan,
      m.nationality_mix.other,
      m.consult_to_surgery_rate,
      m.cashflow.in_man,
      m.cashflow.out_man,
      m.cashflow.net_man,
    ]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function parseMetricsUpload(
  buffer: Buffer,
  filename: string,
): Promise<Metrics> {
  if (buffer.length === 0) {
    throw new MetricsParseError("빈 파일입니다.");
  }
  if (buffer.length > MAX_METRICS_UPLOAD_BYTES) {
    throw new MetricsParseError("파일이 너무 큽니다. 400KB 이하만 받습니다.");
  }
  const name = filename.toLowerCase();
  if (name.endsWith(".csv")) {
    return parseMetricsCsv(buffer.toString("utf8"));
  }
  if (name.endsWith(".xlsx")) {
    return parseMetricsXlsx(buffer);
  }
  throw new MetricsParseError("csv 또는 xlsx만 업로드하세요.");
}
