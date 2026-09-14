import type { DebateInsights } from "@/lib/insights";

export function IssueBundle({ insights }: { insights: DebateInsights }) {
  const empty =
    insights.objections.length +
      insights.risks.length +
      insights.needsData.length ===
    0;
  if (empty) return null;
  return (
    <section className="forest-panel" data-issue-bundle="true">
      <h2 className="forest-panel-title">쟁점 모음</h2>
      <p className="forest-panel-copy">
        이미 나온 발언만 모았습니다. 합의는 적지 않습니다.
      </p>
      {insights.objections.length > 0 ? (
        <p className="forest-panel-copy">
          반대 {insights.objections.length} · 위험 {insights.risks.length} ·
          필요 데이터 {insights.needsData.length}
        </p>
      ) : (
        <p className="forest-panel-copy">
          위험 {insights.risks.length} · 필요 데이터 {insights.needsData.length}
        </p>
      )}
      {insights.needsData.length > 0 ? (
        <ul className="insight-rows">
          {insights.needsData.map((row) => (
            <li key={`${row.persona}-${row.round}-${row.text}`}>{row.text}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
