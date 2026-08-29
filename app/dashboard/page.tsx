"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import { DEMO_SHARE_ID } from "@/lib/debate";
import { readRecentSessions, type RecentSession } from "@/lib/recent-sessions";

type Health = {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
  supabase: boolean;
};

const CHECKS: { key: keyof Health; label: string }[] = [
  { key: "anthropic", label: "Anthropic (재무이사)" },
  { key: "openai", label: "OpenAI (마케팅실장)" },
  { key: "google", label: "Google (진료원장)" },
  { key: "supabase", label: "Supabase" },
];

export default function DashboardPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSession[]>([]);

  useEffect(() => {
    setRecent(readRecentSessions());
    void fetch("/api/health")
      .then(async (res) => {
        if (!res.ok) throw new Error("health_failed");
        return (await res.json()) as Health;
      })
      .then(setHealth)
      .catch(() => setError("연결 상태를 읽지 못했습니다."));
  }, []);

  return (
    <ForestFrame
      title="대시보드"
      subtitle="연결 상태와 이 브라우저에서 연 최근 회의를 봅니다."
      sidebar={
        <ForestPageNote>
          비용과 남은 예산은 설정에서 봅니다. 여기서는 3사 연결과 최근 세션만
          둡니다.
        </ForestPageNote>
      }
    >
      <section className="forest-panel">
        <h2 className="forest-panel-title">연결 상태</h2>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <ul className="health-rows">
          {CHECKS.map((row) => (
            <li key={row.key} className="health-row">
              <span>{row.label}</span>
              <span
                className="health-pill"
                data-ok={health ? String(health[row.key]) : "pending"}
              >
                {health ? (health[row.key] ? "연결됨" : "없음") : "확인 중"}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="forest-panel">
        <h2 className="forest-panel-title">최근 회의</h2>
        {recent.length === 0 ? (
          <p className="forest-panel-copy">
            이 브라우저에서 토론을 시작하면 세션이 여기에 남습니다. 데모는{" "}
            <Link className="forest-dummy-link" href={`/s/${DEMO_SHARE_ID}`}>
              /s/{DEMO_SHARE_ID}
            </Link>
            에서 볼 수 있습니다.
          </p>
        ) : (
          <ul className="recent-session-list">
            {recent.map((row) => (
              <li key={row.id}>
                <Link className="forest-dummy-link" href={`/s/${row.id}`}>
                  {row.agenda}
                </Link>
                <span className="recent-session-id">
                  {" "}
                  ·{" "}
                  <Link className="forest-dummy-link" href={`/decision?id=${row.id}`}>
                    메모
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="forest-panel">
        <h2 className="forest-panel-title">더미 지표</h2>
        <p className="forest-panel-copy">
          <a className="forest-dummy-link" href="/dummy/patient-and-cashflow.csv">
            CSV
          </a>
          {" · "}
          <a className="forest-dummy-link" href="/dummy/patient-and-cashflow.xlsx">
            엑셀
          </a>
        </p>
      </section>
    </ForestFrame>
  );
}
