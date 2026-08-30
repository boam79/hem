"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DebateGlance } from "@/components/debate-glance";
import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import demoShare from "@/data/demo-share.json";
import {
  cellsForRound,
  DEMO_SHARE_ID,
  type DebateTurnRow,
} from "@/lib/debate";
import { apiErrorMessage } from "@/lib/api-errors";
import { readRecentSessions } from "@/lib/recent-sessions";

function DebateInner() {
  const search = useSearchParams();
  const queryId = search.get("id");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agenda, setAgenda] = useState<string | null>(null);
  const [turns, setTurns] = useState<DebateTurnRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<{ id: string; agenda: string }[]>([]);

  useEffect(() => {
    setRecent(readRecentSessions());
    const stored = readRecentSessions()[0]?.id ?? null;
    const id = queryId || stored;
    setSessionId(id);
    if (!id) {
      setLoading(false);
      return;
    }
    if (id === DEMO_SHARE_ID) {
      setAgenda(demoShare.agenda);
      setTurns(demoShare.turns as DebateTurnRow[]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void fetch(`/api/session?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(apiErrorMessage(json, "세션을 찾지 못했습니다."));
        }
        return json as {
          session: { agenda: string };
          turns: DebateTurnRow[];
        };
      })
      .then((body) => {
        setAgenda(body.session.agenda);
        setTurns(body.turns);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "세션을 찾지 못했습니다.");
        setAgenda(null);
        setTurns([]);
      })
      .finally(() => setLoading(false));
  }, [queryId]);

  const round1 = cellsForRound(turns, 1);
  const round2 = cellsForRound(turns, 2);

  return (
    <ForestFrame
      title="토론 결과"
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
      {agenda ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">안건</h2>
          <p className="forest-panel-copy">{agenda}</p>
        </section>
      ) : null}
      {turns.length > 0 ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">라운드 한눈에</h2>
          <DebateGlance round1={round1} round2={round2} />
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
          title="토론 결과"
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
