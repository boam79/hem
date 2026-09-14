"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { DebateGlance } from "@/components/debate-glance";
import { IssueBundle } from "@/components/issue-bundle";
import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import { DEMO_SHARE_ID, cellsForRound } from "@/lib/debate";
import { insightsFromTurns } from "@/lib/insights";
import { apiErrorMessage } from "@/lib/api-errors";
import type { PersonaKey } from "@/lib/schema";
import { useSessionView } from "@/lib/use-session-view";

function DebateInner() {
  const {
    id: sessionId,
    agenda,
    turns,
    error,
    loading,
    recent,
  } = useSessionView();
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [localTurns, setLocalTurns] = useState(turns);
  const shownTurns = localTurns.length > 0 ? localTurns : turns;
  const round1 = cellsForRound(shownTurns, 1);
  const round2 = cellsForRound(shownTurns, 2);
  const insights = insightsFromTurns(shownTurns);

  async function retry(persona: PersonaKey, round: 1 | 2) {
    if (!sessionId || sessionId === DEMO_SHARE_ID) return;
    setRetryError(null);
    setRetrying(true);
    try {
      const res = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, round, persona }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(apiErrorMessage(json, "다시 호출하지 못했습니다."));
      }
      const next = json.turns?.[0];
      if (next) {
        setLocalTurns((prev) => {
          const base = prev.length > 0 ? prev : shownTurns;
          return base.map((row) =>
            row.persona === persona && row.round === round
              ? {
                  ...row,
                  status: next.status,
                  payload: next.payload,
                  error: next.error,
                }
              : row,
          );
        });
      }
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : "다시 호출하지 못했습니다.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <ForestFrame
      title="회의록"
      subtitle="회의실 말풍선은 한 줄 결론입니다. 라운드 전체와 근거는 여기에서 봅니다."
      sidebar={
        <ForestPageNote>
          홈은 동물 캐릭터의 말풍선만 보여 줍니다. 1·2라운드 카드와 공유 링크는
          이 메뉴입니다.
        </ForestPageNote>
      }
    >
      {recent.length > 0 ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">최근 회의</h2>
          <ul className="recent-session-list">
            {recent.map((row) => (
              <li key={row.id}>
                <Link className="forest-dummy-link" href={`/debate?id=${row.id}`}>
                  {row.agenda}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {!loading && !sessionId ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">아직 결과가 없습니다</h2>
          <p className="forest-panel-copy">
            홈에서 토론을 시작하면 세 페르소나의 1·2라운드가 여기에 남습니다.
          </p>
          <p className="forest-panel-copy">
            <Link className="forest-dummy-link" href="/">
              홈으로 토론 시작
            </Link>
            {" · "}
            <Link className="forest-dummy-link" href={`/debate?id=${DEMO_SHARE_ID}`}>
              데모 결과
            </Link>
          </p>
        </section>
      ) : null}
      {loading ? <p className="forest-panel-copy">세션을 불러오는 중…</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {retryError ? <p className="text-destructive text-sm">{retryError}</p> : null}
      {agenda ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">안건</h2>
          <p className="forest-panel-copy">{agenda}</p>
        </section>
      ) : null}
      <IssueBundle insights={insights} />
      {shownTurns.length > 0 ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">라운드 한눈에</h2>
          <DebateGlance
            round1={round1}
            round2={round2}
            onRetry={
              sessionId && sessionId !== DEMO_SHARE_ID && !retrying
                ? retry
                : undefined
            }
          />
          <p className="forest-results-links">
            전체 보기:{" "}
            <Link className="forest-dummy-link" href={`/s/${sessionId}`}>
              /s/{sessionId}
            </Link>
            {" · "}
            <Link className="forest-dummy-link" href={`/decision?id=${sessionId}`}>
              사회자 메모
            </Link>
          </p>
        </section>
      ) : null}
    </ForestFrame>
  );
}

export default function DebatePage() {
  return (
    <Suspense
      fallback={
        <ForestFrame
          title="회의록"
          subtitle="회의실 말풍선은 한 줄 결론입니다. 라운드 전체와 근거는 여기에서 봅니다."
          sidebar={
            <ForestPageNote>세션을 불러오는 중…</ForestPageNote>
          }
        >
          <p className="forest-panel-copy">세션을 불러오는 중…</p>
        </ForestFrame>
      }
    >
      <DebateInner />
    </Suspense>
  );
}
