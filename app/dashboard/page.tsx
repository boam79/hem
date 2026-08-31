"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BoardroomDockBar,
  ForestFrame,
  ForestPageNote,
} from "@/components/forest-shell";
import { MetricsStatsPanel } from "@/components/metrics-stats-panel";
import { DEMO_SHARE_ID } from "@/lib/debate";
import { parseUploadedMetrics } from "@/lib/metrics-stats";
import {
  readMetricsUploadStore,
  type MetricsUploadStore,
} from "@/lib/metrics-upload-store";
import { readRecentSessions, type RecentSession } from "@/lib/recent-sessions";
import type { Metrics } from "@/lib/schema";

type Health = {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
  supabase: boolean;
};

const CHECKS: { key: keyof Health; label: string }[] = [
  { key: "anthropic", label: "재무이사 (앤트로픽)" },
  { key: "openai", label: "마케팅실장 (오픈AI)" },
  { key: "google", label: "진료원장 (구글)" },
  { key: "supabase", label: "데이터베이스" },
];

export default function DashboardPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [upload, setUpload] = useState<MetricsUploadStore | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    setRecent(readRecentSessions());
    const store = readMetricsUploadStore();
    setUpload(store);
    setMetrics(store ? parseUploadedMetrics(store.metrics) : null);
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
      subtitle="올린 지표와 이 브라우저에서 연 최근 회의를 봅니다."
      sidebar={
        <ForestPageNote>
          비용과 남은 예산은 설정에서 봅니다. 여기서는 올린 지표와 3사 연결을
          둡니다.
        </ForestPageNote>
      }
      footer={<BoardroomDockBar sessionId={recent[0]?.id ?? null} />}
    >
      {metrics ? (
        <>
          {upload?.label ? (
            <p className="forest-panel-copy">{upload.label}</p>
          ) : null}
          <MetricsStatsPanel metrics={metrics} />
        </>
      ) : (
        <section className="forest-panel">
          <h2 className="forest-panel-title">올린 지표</h2>
          <p className="forest-panel-copy">
            아직 이 브라우저에 올린 지표가 없습니다. 파일 관리에서 CSV·엑셀을
            올리면 월별 표가 여기에 뜹니다.
          </p>
        </section>
      )}
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
