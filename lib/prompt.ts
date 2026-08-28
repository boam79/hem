import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";
import type { Metrics, TurnPayload } from "@/lib/schema";
import { MetricsSchema } from "@/lib/schema";
import { estimateTokens } from "@/lib/tokens";
import { BASE_RULES, ROUND2_RULES, type Persona } from "@/config/personas";
import rawMetrics from "@/data/metrics.json";

export function loadMetrics(): Metrics {
  return MetricsSchema.parse(rawMetrics);
}

export function metricsForSession(session: { metrics?: unknown } | null): Metrics {
  if (session?.metrics) {
    return MetricsSchema.parse(session.metrics);
  }
  return loadMetrics();
}

export function metricsToMarkdownTable(metrics: Metrics): string {
  const header =
    "| month | lasik | smile | icl | cataract | per_doctor | rev_ref | rev_cat | inflow_ad | inflow_social | inflow_ref | inflow_ov | nat_dom | nat_cn | nat_jp | consult | cash_in | cash_out | cash_net |";
  const sep = "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|";
  const rows = metrics.monthly.map((m) => {
    return `| ${m.month} | ${m.surgeries.lasik} | ${m.surgeries.smile} | ${m.surgeries.icl} | ${m.surgeries.cataract} | ${m.per_doctor_surgeries} | ${m.revenue_mix.refractive} | ${m.revenue_mix.cataract} | ${m.inflow.search_ad} | ${m.inflow.social} | ${m.inflow.referral} | ${m.inflow.overseas_agency} | ${m.nationality_mix.domestic} | ${m.nationality_mix.china} | ${m.nationality_mix.japan} | ${m.consult_to_surgery_rate} | ${m.cashflow.in_man} | ${m.cashflow.out_man} | ${m.cashflow.net_man} |`;
  });
  const table = [header, sep, ...rows].join("\n");
  const tokens = estimateTokens(table);
  if (tokens > METRICS_TABLE_TOKEN_LIMIT) {
    throw new Error(
      `metrics table is ${tokens} tokens, limit ${METRICS_TABLE_TOKEN_LIMIT}`,
    );
  }
  return table;
}

export function buildSystemPrompt(persona: Persona, metrics: Metrics): string {
  return BASE_RULES.replace("{hospital}", metrics.hospital.name)
    .replace("{doctors}", String(metrics.hospital.doctors))
    .replace("{역할}", persona.role)
    .concat(`\n판단 습관: ${persona.habits}`);
}

export function buildRound1UserPrompt(
  agenda: string,
  table: string,
): string {
  return `안건: ${agenda}\n\n[지표]\n${table}`;
}

/** R2 min JSON: objection/changed first so a 400-token cap still keeps F4 fields. */
export const ROUND2_MIN_EXAMPLE =
  '{"objection":"마케팅의 회수 가정이 없습니다","changed":"유지: 현금흐름 우선","position":"보류","evidence":["inflow.search_ad 2026-07"],"risks":[],"needs_data":[]}';

export function round2SystemHint(provider: Persona["provider"] | string): string {
  const common =
    "라운드2 JSON은 objection과 changed를 맨 앞에 채웁니다. 둘 다 빈 문자열 금지. objection은 따옴표 없는 짧은 한국어 한 문장.";
  if (provider === "anthropic") {
    return `${common} 재무(Haiku): objection 예) 회수 가정이 지표에 없습니다. changed 예) 유지: 현금흐름 우선. position은 짧게 남겨 토큰을 objection에 씁니다.`;
  }
  return common;
}

export function jsonOnlySuffix(round: 1 | 2): string {
  const base =
    "반드시 JSON 객체만 출력합니다. 다른 문장 금지. 문자열 안에 큰따옴표와 줄바꿈 금지.";
  if (round === 2) {
    return `${base} objection과 changed는 빈 문자열 금지. 최소 예:\n${ROUND2_MIN_EXAMPLE}`;
  }
  return `${base}\n예: {"position":"보류","evidence":["inflow.search_ad 2026-07"],"risks":[],"needs_data":[]}`;
}

export function round2EmptyRetrySuffix(): string {
  return `이전 출력이 거부됨: objection 또는 changed가 비었습니다. 아래 최소 예시처럼 두 칸을 한국어 한 문장으로 채운 JSON만 출력합니다. 다른 문장 금지.\n예: ${ROUND2_MIN_EXAMPLE}`;
}

export function retrySystemPrompt(
  system: string,
  round: 1 | 2,
  reason: "json" | "empty-r2",
): string {
  if (round === 2 && reason === "empty-r2") {
    return `${system}\n${round2EmptyRetrySuffix()}`;
  }
  return `${system}\n${jsonOnlySuffix(round)}`;
}

export function buildRound2UserPrompt(
  agenda: string,
  table: string,
  others: Array<{ name: string; payload: TurnPayload }>,
): string {
  const lines = others.map(
    (o) =>
      `- ${o.name}: ${o.payload.position} / ${o.payload.evidence.join("; ")} / ${o.payload.risks.join("; ")}`,
  );
  return `${ROUND2_RULES}

안건: ${agenda}

[지표]
${table}

[다른 부서의 라운드 1 발언]
${lines.join("\n")}`;
}
