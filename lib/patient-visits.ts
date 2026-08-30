import type { Metrics } from "@/lib/schema";

export type PatientField =
  | "visit_date"
  | "department"
  | "procedure"
  | "gender"
  | "age_band"
  | "region"
  | "nationality"
  | "inflow"
  | "amount_man"
  | "consulted"
  | "converted";

export type PatientVisit = {
  visitDate: string;
  department: string;
  procedure: string;
  gender: "male" | "female";
  ageBand: string;
  region: string;
  nationality: "domestic" | "china" | "japan" | "other";
  inflow: "search_ad" | "social" | "referral" | "overseas_agency";
  amountMan: number;
  consulted: boolean;
  converted: boolean;
};

export const PATIENT_FIELD_ALIASES: Record<string, PatientField> = {
  visit_date: "visit_date",
  진료일: "visit_date",
  방문일: "visit_date",
  date: "visit_date",
  department: "department",
  진료과: "department",
  과목: "department",
  procedure: "procedure",
  시술: "procedure",
  수술: "procedure",
  세부: "procedure",
  gender: "gender",
  성별: "gender",
  age_band: "age_band",
  나이대: "age_band",
  연령대: "age_band",
  region: "region",
  지역: "region",
  거주지: "region",
  nationality: "nationality",
  국적: "nationality",
  inflow: "inflow",
  유입경로: "inflow",
  유입: "inflow",
  amount_man: "amount_man",
  매출_만원: "amount_man",
  금액_만원: "amount_man",
  consulted: "consulted",
  상담: "consulted",
  converted: "converted",
  수술전환: "converted",
  전환: "converted",
};

const REQUIRED_PATIENT_FIELDS: PatientField[] = [
  "visit_date",
  "department",
  "gender",
  "age_band",
  "region",
];

export class PatientParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatientParseError";
  }
}

export function mapPatientHeader(
  cols: string[],
): Array<PatientField | null> | null {
  const mapped = cols.map((raw) => {
    const key = raw.trim().toLowerCase();
    return PATIENT_FIELD_ALIASES[key] ?? PATIENT_FIELD_ALIASES[raw.trim()] ?? null;
  });
  const present = new Set(mapped.filter((f): f is PatientField => f !== null));
  if (!REQUIRED_PATIENT_FIELDS.every((f) => present.has(f))) return null;
  return mapped;
}

export function isPatientHeader(cols: string[]): boolean {
  return mapPatientHeader(cols) !== null;
}

function flag(v: unknown, fallback: boolean): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "" || s === "undefined") return fallback;
  if (["1", "true", "y", "yes", "예"].includes(s)) return true;
  if (["0", "false", "n", "no", "아니오"].includes(s)) return false;
  return fallback;
}

function numOr(v: unknown, fallback: number): number {
  const s = String(v ?? "").trim().replace(/,/g, "");
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function mapGender(v: string): "male" | "female" {
  const s = v.trim().toLowerCase();
  if (["여", "여성", "f", "female", "w"].includes(s)) return "female";
  return "male";
}

function mapNationality(v: string): PatientVisit["nationality"] {
  const s = v.trim().toLowerCase();
  if (["중국", "china", "cn"].includes(s)) return "china";
  if (["일본", "japan", "jp"].includes(s)) return "japan";
  if (["기타", "other"].includes(s)) return "other";
  return "domestic";
}

function mapInflow(v: string): PatientVisit["inflow"] {
  const s = v.trim().toLowerCase();
  if (s.includes("소셜") || s.includes("social")) return "social";
  if (s.includes("소개") || s.includes("referral")) return "referral";
  if (s.includes("해외") || s.includes("overseas")) return "overseas_agency";
  return "search_ad";
}

export function mapProcedureToSurgery(
  procedure: string,
  department: string,
): "lasik" | "smile" | "icl" | "cataract" | "other" {
  const p = `${procedure} ${department}`.toLowerCase();
  if (p.includes("스마일") || p.includes("smile")) return "smile";
  if (p.includes("icl")) return "icl";
  if (p.includes("백내장") || p.includes("cataract")) return "cataract";
  if (p.includes("라식") || p.includes("라섹") || p.includes("lasik")) return "lasik";
  return "other";
}

export function parsePatientRow(
  header: Array<PatientField | null>,
  values: string[],
): PatientVisit {
  const get = (name: PatientField) => {
    const i = header.indexOf(name);
    return i < 0 ? "" : (values[i] ?? "").trim();
  };
  const department = get("department") || "안과";
  const procedure = get("procedure") || department;
  const dateRaw = get("visit_date");
  return {
    visitDate: normalizeVisitDate(dateRaw),
    department,
    procedure,
    gender: mapGender(get("gender")),
    ageBand: get("age_band") || "40대",
    region: get("region") || "서울",
    nationality: mapNationality(get("nationality")),
    inflow: mapInflow(get("inflow")),
    amountMan: numOr(get("amount_man"), 80),
    consulted: flag(get("consulted"), true),
    converted: flag(get("converted"), true),
  };
}

function normalizeVisitDate(raw: string): string {
  const s = raw.trim();
  const m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3] ?? "01"}`;
  }
  throw new PatientParseError(`진료일이 아닙니다: ${raw}`);
}

export function monthKey(visitDate: string): string {
  return visitDate.slice(0, 7);
}

export function monthsInPeriod(from: string, to: string): string[] {
  const out: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy;
  let m = fm;
  for (let i = 0; i < 24; i++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(key);
    if (y === ty && m === tm) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function clampConsult(n: number): number {
  const rounded = Math.round(n * 100) / 100;
  if (rounded < 0.55) return 0.55;
  if (rounded > 0.7) return 0.7;
  return rounded;
}

function shareList(
  counts: Map<string, number>,
  total: number,
  limit: number,
): Array<{ label: string; share: number }> {
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return rows.slice(0, limit).map(([label, n]) => ({
    label,
    share: total === 0 ? 0 : Math.round((n / total) * 1000) / 1000,
  }));
}

function mix3(a: number, b: number, c: number): { refractive: number; cataract: number; other: number } {
  const s = a + b + c;
  if (s <= 0) return { refractive: 0.54, cataract: 0.38, other: 0.08 };
  return {
    refractive: Math.round((a / s) * 100) / 100,
    cataract: Math.round((b / s) * 100) / 100,
    other: Math.round((c / s) * 100) / 100,
  };
}

function mix4(
  dom: number,
  cn: number,
  jp: number,
  other: number,
): Metrics["monthly"][number]["nationality_mix"] {
  const s = dom + cn + jp + other;
  if (s <= 0) return { domestic: 0.87, china: 0.06, japan: 0.04, other: 0.03 };
  return {
    domestic: Math.round((dom / s) * 100) / 100,
    china: Math.round((cn / s) * 100) / 100,
    japan: Math.round((jp / s) * 100) / 100,
    other: Math.round((other / s) * 100) / 100,
  };
}

export function aggregatePatientVisits(
  meta: {
    _note?: string;
    hospital_name?: string;
    hospital_type?: string;
    doctors?: string;
    period_from?: string;
    period_to?: string;
  },
  visits: PatientVisit[],
  doctorsCount?: number,
): Metrics {
  if (visits.length === 0) {
    throw new PatientParseError("환자 행이 없습니다.");
  }
  const from = meta.period_from || monthKey(visits[0].visitDate);
  const to = meta.period_to || monthKey(visits[visits.length - 1].visitDate);
  const months = monthsInPeriod(from, to);
  if (months.length !== 12) {
    throw new PatientParseError("시작월·종료월은 12개월이어야 합니다.");
  }
  const doctors = doctorsCount ?? numOr(meta.doctors, 12);
  const byMonth = new Map<string, PatientVisit[]>();
  for (const m of months) byMonth.set(m, []);
  for (const v of visits) {
    const k = monthKey(v.visitDate);
    const bucket = byMonth.get(k);
    if (bucket) bucket.push(v);
  }

  const genderCounts = { male: 0, female: 0 };
  const ageCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const deptCounts = new Map<string, number>();

  const monthly: Metrics["monthly"] = months.map((month) => {
    const rows = byMonth.get(month) ?? [];
    const surgeries = { lasik: 0, smile: 0, icl: 0, cataract: 0 };
    let revRef = 0;
    let revCat = 0;
    let revOther = 0;
    const inflow = {
      search_ad: 0,
      social: 0,
      referral: 0,
      overseas_agency: 0,
    };
    let natDom = 0;
    let natCn = 0;
    let natJp = 0;
    let natOther = 0;
    let consulted = 0;
    let converted = 0;
    let cashIn = 0;

    for (const v of rows) {
      genderCounts[v.gender] += 1;
      ageCounts.set(v.ageBand, (ageCounts.get(v.ageBand) ?? 0) + 1);
      regionCounts.set(v.region, (regionCounts.get(v.region) ?? 0) + 1);
      deptCounts.set(v.department, (deptCounts.get(v.department) ?? 0) + 1);
      const kind = mapProcedureToSurgery(v.procedure, v.department);
      if (kind !== "other") surgeries[kind] += 1;
      if (kind === "cataract") revCat += v.amountMan;
      else if (kind === "other") revOther += v.amountMan;
      else revRef += v.amountMan;
      inflow[v.inflow] += 1;
      if (v.nationality === "domestic") natDom += 1;
      else if (v.nationality === "china") natCn += 1;
      else if (v.nationality === "japan") natJp += 1;
      else natOther += 1;
      if (v.consulted) consulted += 1;
      if (v.converted) converted += 1;
      cashIn += v.amountMan;
    }

    const surgeryTotal =
      surgeries.lasik + surgeries.smile + surgeries.icl + surgeries.cataract;
    const cashOut = Math.round(cashIn * 0.78);
    const rate = consulted === 0 ? 0.61 : converted / consulted;

    return {
      month,
      surgeries,
      per_doctor_surgeries: Math.round(surgeryTotal / Math.max(doctors, 1)),
      revenue_mix: mix3(revRef, revCat, revOther),
      inflow,
      nationality_mix: mix4(natDom, natCn, natJp, natOther),
      consult_to_surgery_rate: clampConsult(rate),
      cashflow: {
        in_man: Math.round(cashIn),
        out_man: cashOut,
        net_man: Math.round(cashIn) - cashOut,
      },
    };
  });

  const total = visits.length;
  return {
    _note:
      meta._note ||
      "업로드 환자 더미. 전 진료과·성별·나이대·지역 합성. 실제 병원 아님.",
    hospital: {
      name: meta.hospital_name || "포레스트병원(가상)",
      type: meta.hospital_type || "안과 중심 종합병원(가상)",
      doctors,
    },
    period: { from, to },
    monthly,
    demographics: {
      gender: {
        male: total === 0 ? 0 : Math.round((genderCounts.male / total) * 1000) / 1000,
        female: total === 0 ? 0 : Math.round((genderCounts.female / total) * 1000) / 1000,
      },
      age_bands: shareList(ageCounts, total, 9),
      regions: shareList(regionCounts, total, 8),
      departments: shareList(deptCounts, total, 10),
    },
  };
}

export function demographicsLine(metrics: Metrics): string | null {
  const d = metrics.demographics;
  if (!d) return null;
  const gender = `성별 남 ${Math.round(d.gender.male * 100)}% 여 ${Math.round(d.gender.female * 100)}%`;
  const age = d.age_bands
    .slice(0, 4)
    .map((x) => `${x.label} ${Math.round(x.share * 100)}%`)
    .join(", ");
  const region = d.regions
    .slice(0, 4)
    .map((x) => `${x.label} ${Math.round(x.share * 100)}%`)
    .join(", ");
  const dept = d.departments
    .slice(0, 6)
    .map((x) => `${x.label} ${Math.round(x.share * 100)}%`)
    .join(", ");
  return `${gender} · 나이대 ${age} · 지역 ${region} · 진료과 ${dept}`;
}
