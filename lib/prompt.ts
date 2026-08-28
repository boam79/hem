import { METRICS_TABLE_TOKEN_LIMIT } from "@/config/limits";
import type { Metrics, TurnPayload } from "@/lib/schema";
import { MetricsSchema } from "@/lib/schema";
import { estimateTokens } from "@/lib/tokens";
import { BASE_RULES, ROUND2_RULES, type Persona } from "@/config/personas";
import rawMetrics from "@/data/metrics.json";

export function loadMetrics(): Metrics {
  return MetricsSchema.parse(rawMetrics);
}

export function metricsToMarkdownTable(metrics: Metrics): string {
  const header =
    "| month | lasik | smile | icl | cataract | per_doctor | rev_ref | rev_cat | inflow_ad | inflow_social | inflow_ref | inflow_ov | nat_dom | nat_cn | nat_jp | consult |";
  const sep = "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|";
  const rows = metrics.monthly.map((m) => {
    return `| ${m.month} | ${m.surgeries.lasik} | ${m.surgeries.smile} | ${m.surgeries.icl} | ${m.surgeries.cataract} | ${m.per_doctor_surgeries} | ${m.revenue_mix.refractive} | ${m.revenue_mix.cataract} | ${m.inflow.search_ad} | ${m.inflow.social} | ${m.inflow.referral} | ${m.inflow.overseas_agency} | ${m.nationality_mix.domestic} | ${m.nationality_mix.china} | ${m.nationality_mix.japan} | ${m.consult_to_surgery_rate} |`;
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

export function jsonOnlySuffix(round: 1 | 2): string {
  const base =
    "반드시 JSON 객체만 출력합니다. 다른 문장 금지. 문자열 안에 큰따옴표와 줄바꿈 금지.";
  if (round === 2) {
    return `${base} objection과 changed는 빈 문자열 금지.\n예: {"position":"보류","evidence":["inflow.search_ad 2026-07"],"risks":[],"needs_data":[],"objection":"회수 가정이 없습니다","changed":"유지: 현금흐름 우선"}`;
  }
  return `${base}\n예: {"position":"보류","evidence":["inflow.search_ad 2026-07"],"risks":[],"needs_data":[]}`;
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
