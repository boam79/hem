"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import { MemoForm } from "@/components/memo-form";
import { MemoView } from "@/components/memo-view";
import demoShare from "@/data/demo-share.json";
import { DEMO_SHARE_ID } from "@/lib/debate";
import { apiErrorMessage } from "@/lib/api-errors";
import { readRecentSessions } from "@/lib/recent-sessions";
import { MemoSchema, type Memo } from "@/lib/schema";

function DecisionInner() {
  const search = useSearchParams();
  const queryId = search.get("id");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agenda, setAgenda] = useState<string | null>(null);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readRecentSessions()[0]?.id ?? null;
    const id = queryId || stored;
    setSessionId(id);
    if (!id) {
      setLoading(false);
      return;
    }
    if (id === DEMO_SHARE_ID) {
      const parsed = MemoSchema.safeParse(demoShare.memo);
      setAgenda(demoShare.agenda);
      setMemo(parsed.success ? parsed.data : null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void fetch(`/api/session?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(apiErrorMessage(json, "세션을 찾지 못했습니다."));
        return json as {
          session: { agenda: string; memo?: unknown };
        };
      })
      .then((body) => {
        setAgenda(body.session.agenda);
        const parsed = body.session.memo
          ? MemoSchema.safeParse(body.session.memo)
          : null;
        setMemo(parsed?.success ? parsed.data : null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "세션을 찾지 못했습니다.");
        setAgenda(null);
        setMemo(null);
      })
      .finally(() => setLoading(false));
  }, [queryId]);

  return (
    <ForestFrame
      title="시나리오 결과"
      subtitle="모델은 결정하지 않습니다. 합의·쟁점·공백·선택지만 사람이 적습니다."
      sidebar={
        <ForestPageNote>
          홈에서 토론이 끝나면 여기로 옵니다. 페르소나가 결론을 내지
          않습니다.
        </ForestPageNote>
      }
    >
      {!loading && !sessionId ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">사회자 메모</h2>
          <p className="forest-panel-copy">
            아직 이 브라우저에 최근 회의가 없습니다. 홈에서 토론을 시작하거나
            데모 공유를 여세요.
          </p>
          <p className="forest-panel-copy">
            <Link className="forest-dummy-link" href="/">
              홈으로 토론 시작
            </Link>
            {" · "}
            <Link className="forest-dummy-link" href={`/s/${DEMO_SHARE_ID}`}>
              데모 공유
            </Link>
            {" · "}
            <Link className="forest-dummy-link" href="/decision?id=uE7m2G">
              저장된 메모 예시
            </Link>
          </p>
        </section>
      ) : null}
      {sessionId && !queryId ? (
        <p className="forest-panel-copy">
          최근 세션 {sessionId}. 다른 회의는 대시보드에서 고를 수 있습니다.
        </p>
      ) : null}
      {loading ? <p className="forest-panel-copy">세션을 불러오는 중…</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {agenda ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">안건</h2>
          <p className="forest-panel-copy">{agenda}</p>
        </section>
      ) : null}
      {memo ? <MemoView memo={memo} /> : null}
      {sessionId && sessionId !== DEMO_SHARE_ID && !loading && !error ? (
        <MemoForm sessionId={sessionId} />
      ) : null}
      {sessionId === DEMO_SHARE_ID ? (
        <p className="forest-panel-copy">
          데모 백업은 읽기 전용입니다. 실세션 메모는 홈 토론 뒤에 저장됩니다.
        </p>
      ) : null}
    </ForestFrame>
  );
}

export default function DecisionPage() {
  return (
    <Suspense
      fallback={
        <ForestFrame
          title="시나리오 결과"
          subtitle="모델은 결정하지 않습니다. 합의·쟁점·공백·선택지만 사람이 적습니다."
          sidebar={
            <ForestPageNote>세션을 불러오는 중…</ForestPageNote>
          }
        >
          <p className="forest-panel-copy">세션을 불러오는 중…</p>
        </ForestFrame>
      }
    >
      <DecisionInner />
    </Suspense>
  );
}
