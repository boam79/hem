import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";

const base = JSON.parse(readFileSync("data/metrics.json", "utf8"));
const dummy = {
  ...base,
  _note: "업로드 더미. 재무흐름(현금유입·유출)과 환자통계(수술·유입). 실제 병원 아님.",
  hospital: { ...base.hospital, name: "업로드안과(가상)" },
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

const header = [
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

function csvEscape(s) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const meta = [
  `_note,${csvEscape(dummy._note)}`,
  `hospital_name,${csvEscape(dummy.hospital.name)}`,
  `hospital_type,${csvEscape(dummy.hospital.type)}`,
  `doctors,${dummy.hospital.doctors}`,
  `period_from,${dummy.period.from}`,
  `period_to,${dummy.period.to}`,
];
const body = dummy.monthly.map((m) =>
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
const csv = [...meta, "", header.join(","), ...body].join("\n") + "\n";

const dir = resolve("public/dummy");
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, "patient-and-cashflow.csv"), csv);

const wb = new ExcelJS.Workbook();
const hospital = wb.addWorksheet("hospital");
hospital.addRow(["_note", dummy._note]);
hospital.addRow(["hospital_name", dummy.hospital.name]);
hospital.addRow(["hospital_type", dummy.hospital.type]);
hospital.addRow(["doctors", dummy.hospital.doctors]);
hospital.addRow(["period_from", dummy.period.from]);
hospital.addRow(["period_to", dummy.period.to]);
const monthly = wb.addWorksheet("monthly");
monthly.addRow(header);
for (const m of dummy.monthly) {
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
const xlsx = Buffer.from(await wb.xlsx.writeBuffer());
writeFileSync(resolve(dir, "patient-and-cashflow.xlsx"), xlsx);
console.log("wrote", dir);
