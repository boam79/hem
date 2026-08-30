import { summarizeMetrics } from "@/lib/metrics-stats";
import type { Metrics } from "@/lib/schema";

function num(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function MetricsStatsPanel({ metrics }: { metrics: Metrics }) {
  const summary = summarizeMetrics(metrics);
  return (
    <section className="forest-panel" id="upload-stats">
      <h2 className="forest-panel-title">업로드 통계</h2>
      <p className="forest-panel-copy">
        {summary.hospitalName} · {summary.periodFrom} ~ {summary.periodTo} ·
        의사 {summary.doctors}명
      </p>
      <p className="forest-panel-copy">
        수술 합 {num(summary.surgeryTotal)}건 · 기간 순현금{" "}
        {num(summary.cashNetTotal)}만원
      </p>
      <div className="metrics-stats-wrap">
        <table className="metrics-stats-table">
          <thead>
            <tr>
              <th>월</th>
              <th>라식</th>
              <th>스마일</th>
              <th>ICL</th>
              <th>백내장</th>
              <th>유입</th>
              <th>유출</th>
              <th>순현금</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{num(row.lasik)}</td>
                <td>{num(row.smile)}</td>
                <td>{num(row.icl)}</td>
                <td>{num(row.cataract)}</td>
                <td>{num(row.cashIn)}</td>
                <td>{num(row.cashOut)}</td>
                <td>{num(row.cashNet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
