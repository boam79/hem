import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";

const spec = JSON.parse(
  readFileSync(resolve("data/patient-dummy-spec.json"), "utf8"),
);

const MAX = 400_000;
const TARGET_MIN = 370_000;
const TARGET_MAX = 395_000;

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, items) {
  return items[Math.floor(rand() * items.length)];
}

function weightedPick(rand, pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let x = rand() * total;
  for (const [item, w] of pairs) {
    x -= w;
    if (x <= 0) return item;
  }
  return pairs[pairs.length - 1][0];
}

function monthsInPeriod(from, to) {
  const out = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy;
  let m = fm;
  for (let i = 0; i < 24; i++) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (y === ty && m === tm) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function daysInMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function visitDate(rand, ym) {
  const day = 1 + Math.floor(rand() * daysInMonth(ym));
  return `${ym}-${String(day).padStart(2, "0")}`;
}

const OTHER_PROCEDURE = {
  영상의학과: "검사",
  진단검사의학과: "검사",
  병리과: "검사",
  핵의학과: "검사",
  방사선종양학과: "치료",
  응급의학과: "응급",
  마취통증의학과: "통증진료",
  치과: "치과진료",
};

function procedureFor(dept, rand) {
  if (dept === "안과") return pick(rand, spec.eyeProcedures);
  return OTHER_PROCEDURE[dept] || "외래";
}

function ageFor(dept, procedure, rand) {
  if (dept === "소아청소년과" || procedure === "소아안과") {
    return pick(rand, ["0-9", "10대"]);
  }
  if (["라식", "스마일", "라섹", "ICL"].includes(procedure)) {
    return pick(rand, ["20대", "30대", "40대"]);
  }
  if (procedure === "백내장" || procedure === "녹내장") {
    return pick(rand, ["60대", "70대", "80대이상"]);
  }
  return pick(rand, spec.ageBands);
}

function amountFor(procedure, dept, rand) {
  const table = {
    라식: 180,
    스마일: 230,
    라섹: 150,
    ICL: 280,
    백내장: 210,
    녹내장: 90,
    망막: 160,
    각막: 140,
    소아안과: 70,
    안성형: 120,
    사시: 95,
    외안부: 55,
    신경안과: 80,
  };
  const base = table[procedure] ?? (dept === "안과" ? 80 : 45);
  return base + Math.floor(rand() * 25);
}

const deptWeights = spec.departments.map((d) => {
  if (d === "안과") return [d, 34];
  if (d === "내과") return [d, 8];
  if (d === "정형외과") return [d, 7];
  if (d === "이비인후과") return [d, 5];
  if (d === "피부과") return [d, 5];
  if (d === "가정의학과") return [d, 5];
  if (d === "산부인과") return [d, 4];
  if (d === "소아청소년과") return [d, 4];
  return [d, 1.2];
});

const regionWeights = spec.regions.map((r) => {
  if (r === "서울") return [r, 28];
  if (r === "경기") return [r, 22];
  if (r === "인천") return [r, 6];
  if (r === "부산") return [r, 6];
  return [r, 2.2];
});

function makeVisit(rand, month, forced) {
  const department = forced?.department ?? weightedPick(rand, deptWeights);
  const procedure = forced?.procedure ?? procedureFor(department, rand);
  const gender = forced?.gender ?? (rand() < 0.54 ? "여" : "남");
  const age_band = forced?.age_band ?? ageFor(department, procedure, rand);
  const region = forced?.region ?? weightedPick(rand, regionWeights);
  const nationality =
    forced?.nationality ??
    weightedPick(rand, [
      ["국내", 84],
      ["중국", 7],
      ["일본", 5],
      ["기타", 4],
    ]);
  const inflow =
    forced?.inflow ??
    weightedPick(rand, [
      ["검색광고", 42],
      ["소셜", 24],
      ["소개", 26],
      ["해외에이전시", 8],
    ]);
  const converted = rand() < 0.62 ? 1 : 0;
  return {
    visit_date: visitDate(rand, month),
    department,
    procedure,
    gender,
    age_band,
    region,
    nationality,
    inflow,
    amount_man: amountFor(procedure, department, rand),
    consulted: 1,
    converted,
  };
}

function visitLine(v) {
  return [
    v.visit_date,
    v.department,
    v.procedure,
    v.gender,
    v.age_band,
    v.region,
    v.nationality,
    v.inflow,
    v.amount_man,
    v.consulted,
    v.converted,
  ].join(",");
}

function coverageVisits(rand, months) {
  const rows = [];
  for (const department of spec.departments) {
    rows.push(
      makeVisit(rand, months[0], {
        department,
        procedure: procedureFor(department, rand),
      }),
    );
  }
  for (const procedure of spec.eyeProcedures) {
    rows.push(makeVisit(rand, months[1], { department: "안과", procedure }));
  }
  for (const gender of spec.genders) {
    rows.push(makeVisit(rand, months[2], { gender }));
  }
  for (const age_band of spec.ageBands) {
    rows.push(makeVisit(rand, months[3], { age_band, department: "내과" }));
  }
  for (const region of spec.regions) {
    rows.push(makeVisit(rand, months[4], { region, department: "가정의학과" }));
  }
  for (const nationality of spec.nationalities) {
    rows.push(makeVisit(rand, months[5], { nationality }));
  }
  for (const inflow of spec.inflows) {
    rows.push(makeVisit(rand, months[6], { inflow }));
  }
  for (const month of months) {
    for (let i = 0; i < 8; i++) rows.push(makeVisit(rand, month, {}));
  }
  return rows;
}

function csvFromVisits(visits) {
  const meta = [
    "비고,업로드 환자 더미. 전 진료과·성별·나이대·지역 합성. 실제 병원 아님.",
    `병원명,${spec.hospital.name}`,
    `병원유형,${spec.hospital.type}`,
    `의사수,${spec.hospital.doctors}`,
    `시작월,${spec.period.from}`,
    `종료월,${spec.period.to}`,
  ];
  const header =
    "진료일,진료과,시술,성별,나이대,지역,국적,유입경로,매출_만원,상담,수술전환";
  return [...meta, "", header, ...visits.map(visitLine)].join("\n") + "\n";
}

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
];

function surgeryKind(procedure, department) {
  const p = `${procedure} ${department}`.toLowerCase();
  if (p.includes("스마일") || p.includes("smile")) return "smile";
  if (p.includes("icl")) return "icl";
  if (p.includes("백내장") || p.includes("cataract")) return "cataract";
  if (p.includes("라식") || p.includes("라섹") || p.includes("lasik")) return "lasik";
  return "other";
}

function inflowKey(inflow) {
  if (String(inflow).includes("소셜")) return "social";
  if (String(inflow).includes("소개")) return "referral";
  if (String(inflow).includes("해외")) return "overseas";
  return "ad";
}

function clampConsult(n) {
  const rounded = Math.round(n * 100) / 100;
  if (rounded < 0.55) return 0.55;
  if (rounded > 0.7) return 0.7;
  return rounded;
}

function mix3(a, b, c) {
  const s = a + b + c;
  if (s <= 0) return { refractive: 0.54, cataract: 0.38, other: 0.08 };
  return {
    refractive: Math.round((a / s) * 100) / 100,
    cataract: Math.round((b / s) * 100) / 100,
    other: Math.round((c / s) * 100) / 100,
  };
}

function mix4(dom, cn, jp, other) {
  const s = dom + cn + jp + other;
  if (s <= 0) return { domestic: 0.87, china: 0.06, japan: 0.04, other: 0.03 };
  return {
    domestic: Math.round((dom / s) * 100) / 100,
    china: Math.round((cn / s) * 100) / 100,
    japan: Math.round((jp / s) * 100) / 100,
    other: Math.round((other / s) * 100) / 100,
  };
}

function monthlyRows(visits, monthList, doctors) {
  return monthList.map((month) => {
    const rows = visits.filter((v) => v.visit_date.startsWith(month));
    const surgeries = { lasik: 0, smile: 0, icl: 0, cataract: 0 };
    let revRef = 0;
    let revCat = 0;
    let revOther = 0;
    const inflow = { ad: 0, social: 0, referral: 0, overseas: 0 };
    let natDom = 0;
    let natCn = 0;
    let natJp = 0;
    let natOther = 0;
    let consulted = 0;
    let converted = 0;
    let cashIn = 0;
    for (const v of rows) {
      const kind = surgeryKind(v.procedure, v.department);
      if (kind !== "other") surgeries[kind] += 1;
      if (kind === "cataract") revCat += v.amount_man;
      else if (kind === "other") revOther += v.amount_man;
      else revRef += v.amount_man;
      inflow[inflowKey(v.inflow)] += 1;
      if (v.nationality === "중국") natCn += 1;
      else if (v.nationality === "일본") natJp += 1;
      else if (v.nationality === "기타") natOther += 1;
      else natDom += 1;
      consulted += v.consulted ? 1 : 0;
      converted += v.converted ? 1 : 0;
      cashIn += v.amount_man;
    }
    const surgeryTotal =
      surgeries.lasik + surgeries.smile + surgeries.icl + surgeries.cataract;
    const cashOut = Math.round(cashIn * 0.78);
    const mix = mix3(revRef, revCat, revOther);
    const nat = mix4(natDom, natCn, natJp, natOther);
    const rate = consulted === 0 ? 0.61 : converted / consulted;
    return [
      month,
      surgeries.lasik,
      surgeries.smile,
      surgeries.icl,
      surgeries.cataract,
      Math.round(surgeryTotal / Math.max(doctors, 1)),
      mix.refractive,
      mix.cataract,
      mix.other,
      inflow.ad,
      inflow.social,
      inflow.referral,
      inflow.overseas,
      nat.domestic,
      nat.china,
      nat.japan,
      nat.other,
      clampConsult(rate),
      Math.round(cashIn),
      cashOut,
      Math.round(cashIn) - cashOut,
    ];
  });
}

function csvEscape(s) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvFromMonthly(visits, monthList) {
  const meta = [
    `_note,${csvEscape("업로드 환자 더미. 전 진료과·성별·나이대·지역을 월별로 합침. 실제 병원 아님.")}`,
    `hospital_name,${csvEscape(spec.hospital.name)}`,
    `hospital_type,${csvEscape(spec.hospital.type)}`,
    `doctors,${spec.hospital.doctors}`,
    `period_from,${spec.period.from}`,
    `period_to,${spec.period.to}`,
  ];
  const body = monthlyRows(visits, monthList, spec.hospital.doctors).map((r) =>
    r.join(","),
  );
  return [...meta, "", MONTH_HEADER.join(","), ...body].join("\n") + "\n";
}

const rand = mulberry32(260830);
const months = monthsInPeriod(spec.period.from, spec.period.to);
let visits = coverageVisits(rand, months);

function csvBytes(rows) {
  return Buffer.byteLength(csvFromVisits(rows), "utf8");
}

while (csvBytes(visits) < TARGET_MIN) {
  const month = pick(rand, months);
  visits.push(makeVisit(rand, month, {}));
}
while (csvBytes(visits) > TARGET_MAX) {
  visits.pop();
}

const csvVisits = csvFromVisits(visits);
const csvVisitsSize = Buffer.byteLength(csvVisits, "utf8");
if (csvVisitsSize > MAX) {
  throw new Error(`visits csv ${csvVisitsSize} exceeds ${MAX}`);
}

const csvMonthly = csvFromMonthly(visits, months);
const csvMonthlySize = Buffer.byteLength(csvMonthly, "utf8");

const dir = resolve("public/dummy");
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, "hospital-patients-visits.csv"), csvVisits);
writeFileSync(resolve(dir, "hospital-patients-full.csv"), csvMonthly);

async function writeXlsx(rows) {
  const wb = new ExcelJS.Workbook();
  const hospital = wb.addWorksheet("hospital");
  hospital.addRow(["_note", "업로드 환자 더미. 전 진료과·성별·나이대·지역 합성. 실제 병원 아님."]);
  hospital.addRow(["hospital_name", spec.hospital.name]);
  hospital.addRow(["hospital_type", spec.hospital.type]);
  hospital.addRow(["doctors", spec.hospital.doctors]);
  hospital.addRow(["period_from", spec.period.from]);
  hospital.addRow(["period_to", spec.period.to]);

  const monthly = wb.addWorksheet("monthly");
  monthly.addRow(MONTH_HEADER);
  for (const row of monthlyRows(rows, months, spec.hospital.doctors)) {
    monthly.addRow(row);
  }

  const patients = wb.addWorksheet("patients");
  patients.addRow([
    "진료일",
    "진료과",
    "시술",
    "성별",
    "나이대",
    "지역",
    "국적",
    "유입경로",
    "매출_만원",
    "상담",
    "수술전환",
  ]);
  for (const v of rows) {
    patients.addRow([
      v.visit_date,
      v.department,
      v.procedure,
      v.gender,
      v.age_band,
      v.region,
      v.nationality,
      v.inflow,
      v.amount_man,
      v.consulted,
      v.converted,
    ]);
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

let xlsxRows = visits;
let xlsx = await writeXlsx(xlsxRows);
while (xlsx.length > TARGET_MAX && xlsxRows.length > 400) {
  xlsxRows = xlsxRows.slice(0, Math.floor(xlsxRows.length * 0.85));
  xlsx = await writeXlsx(xlsxRows);
}
if (xlsx.length > MAX) {
  throw new Error(`xlsx ${xlsx.length} exceeds ${MAX}`);
}
writeFileSync(resolve(dir, "hospital-patients-full.xlsx"), xlsx);

console.log(
  JSON.stringify(
    {
      monthlyCsvBytes: csvMonthlySize,
      visitsCsvBytes: csvVisitsSize,
      visitsRows: visits.length,
      xlsxBytes: xlsx.length,
      xlsxRows: xlsxRows.length,
    },
    null,
    2,
  ),
);
