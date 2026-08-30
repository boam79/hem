import type { TurnPayload } from "@/lib/schema";

/** Compact Korean headers for the LLM metrics table. Schema keys stay English. */
export const METRICS_TABLE_HEADER =
  "| 월 | 라식 | 스마일 | 안내렌즈 | 백내장 | 의사당수술 | 굴절매출 | 백내장매출 | 검색광고 | 소셜 | 소개 | 해외 | 국내 | 중국 | 일본 | 전환율 | 현금유입 | 현금유출 | 순현금 |";

export const ROUND1_LABEL = "1라운드";
export const ROUND2_LABEL = "2라운드";

/**
 * Longest first. Visible copy only — CSV/JSON field names stay English.
 */
const LITERALS: [string, string][] = [
  ["consult_to_surgery_rate", "상담전환율"],
  ["per_doctor_surgeries", "의사 1인당 수술"],
  ["nationality_mix.domestic", "국내 환자 비중"],
  ["nationality_mix.china", "중국 환자 비중"],
  ["nationality_mix.japan", "일본 환자 비중"],
  ["nationality_mix.other", "기타 국적 비중"],
  ["revenue_mix.refractive", "굴절 매출 비중"],
  ["revenue_mix.cataract", "백내장 매출 비중"],
  ["revenue_mix.other", "기타 매출 비중"],
  ["inflow.overseas_agency", "해외 에이전시 유입"],
  ["inflow.search_ad", "검색광고 유입"],
  ["inflow.referral", "소개 유입"],
  ["inflow.social", "소셜 유입"],
  ["surgeries.cataract", "백내장"],
  ["surgeries.lasik", "라식"],
  ["surgeries.smile", "스마일"],
  ["surgeries.icl", "안내렌즈"],
  ["cashflow.net_man", "순현금"],
  ["cashflow.out_man", "현금 유출"],
  ["cashflow.in_man", "현금 유입"],
  ["inflow_social", "소셜 유입"],
  ["inflow_ad", "검색광고 유입"],
  ["inflow_ref", "소개 유입"],
  ["inflow_ov", "해외 에이전시 유입"],
  ["search_ad", "검색광고"],
  ["nat_other", "기타 국적 비중"],
  ["nat_dom", "국내 환자 비중"],
  ["nat_cn", "중국 환자 비중"],
  ["nat_jp", "일본 환자 비중"],
  ["rev_other", "기타 매출 비중"],
  ["rev_ref", "굴절 매출 비중"],
  ["rev_cat", "백내장 매출 비중"],
  ["cash_net", "순현금"],
  ["cash_out", "현금 유출"],
  ["cash_in", "현금 유입"],
  ["per_doctor", "의사 1인당 수술"],
  ["needs_data", "필요 데이터"],
  ["ad-consult", "광고-상담"],
  ["트레이드오프", "상충"],
  ["트레이드 오프", "상충"],
];

const SORTED = [...LITERALS].sort((a, b) => b[0].length - a[0].length);

const WORD: [RegExp, string][] = [
  [/\btrade-?offs?\b/gi, "상충"],
  [/\bLASIK\b/g, "라식"],
  [/\blasik\b/g, "라식"],
  [/\bSMILE\b/g, "스마일"],
  [/\bsmile\b/g, "스마일"],
  [/\bICL\b/g, "안내렌즈"],
  [/\bcataract\b/gi, "백내장"],
  [/\bconsult\b/gi, "상담"],
  [/CAC와/g, "유치비용과"],
  [/CAC과/g, "유치비용과"],
  [/\bCAC\b/g, "유치비용"],
  [/\bLTV\b/g, "생애가치"],
  [/투자\s*ROI/gi, "투자 성과"],
  [/\bROI\b/g, "투자성과"],
  [/\bKPI\b/g, "핵심지표"],
  [/\bCFO\b/g, "재무이사"],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function koreanizePublicText(input: string): string {
  let s = input;
  for (const [from, to] of SORTED) {
    s = s.replace(new RegExp(escapeRegExp(from), "gi"), to);
  }
  for (const [re, to] of WORD) {
    s = s.replace(re, to);
  }
  return s;
}

export function koreanizePayload(payload: TurnPayload): TurnPayload {
  return {
    ...payload,
    position: koreanizePublicText(payload.position),
    evidence: payload.evidence.map(koreanizePublicText),
    risks: payload.risks.map(koreanizePublicText),
    needs_data: payload.needs_data.map(koreanizePublicText),
    objection: payload.objection
      ? koreanizePublicText(payload.objection)
      : payload.objection,
    changed: payload.changed
      ? koreanizePublicText(payload.changed)
      : payload.changed,
  };
}
