"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import { SessionLoadError } from "@/components/session-load-error";
import { PERSONAS } from "@/config/personas";
import { DEMO_SHARE_ID } from "@/lib/debate";
import {
  insightsAreEmpty,
  insightsFromTurns,
  type InsightLine,
} from "@/lib/insights";
import { useSessionView } from "@/lib/use-session-view";
import type { PersonaKey } from "@/lib/schema";

const PERSONA_NAME: Record<PersonaKey, string> = {
  cfo: PERSONAS[0].name,
  mkt: PERSONAS[1].name,
  md: PERSONAS[2].name,
};

function InsightList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: InsightLine[];
  empty: string;
}) {
  return (
    <section className="forest-panel">
      <h2 className="forest-panel-title">{title}</h2>
      {rows.length === 0 ? (
        <p className="forest-panel-copy">{empty}</p>
      ) : (
        <ul className="insight-rows">
          {rows.map((row) => (
            <li key={`${row.persona}-${row.round}-${row.text}`}>
              <span className="insight-who">{PERSONA_NAME[row.persona]}</span>
              <span>{row.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function InsightsInner() {
  const {
    id: sessionId,
    agenda,
    turns,
    error,
    loading,
  } = useSessionView();
  const insights = insightsFromTurns(turns);

  return (
    <ForestFrame
      title="AI 인사이트"
      subtitle="네 번째 모델을 부르지 않습니다. 세 입장에서 반대·위험·필요 데이터만 모읍니다."
      sidebar={
        <ForestPageNote>
          결정은 사람이 합니다. 여기는 토론에 이미 나온 빈칸과 반대를 한곳에
          모은 화면입니다.
        </ForestPageNote>
      }
    >
      {!loading && !sessionId ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">아직 인사이트가 없습니다</h2>
          <p className="forest-panel-copy">
            홈에서 토론을 시작하면 반대 논거와 필요 데이터가 여기에 모입니다.
          </p>
          <p className="forest-panel-copy">
            <Link className="forest-dummy-link" href="/">
              홈으로 토론 시작
            </Link>
            {" · "}
            <Link
              className="forest-dummy-link"
              href={`/insights?id=${DEMO_SHARE_ID}`}
            >
              데모 인사이트
            </Link>
          </p>
        </section>
      ) : null}
      {loading ? <p className="forest-panel-copy">세션을 불러오는 중…</p> : null}
      {error ? (
        <SessionLoadError
          error={error}
          demoHref={`/insights?id=${DEMO_SHARE_ID}`}
          demoLabel="데모 인사이트"
        />
      ) : null}
      {agenda ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">안건</h2>
          <p className="forest-panel-copy">{agenda}</p>
        </section>
      ) : null}
      {sessionId && !loading && !error && !insightsAreEmpty(insights) ? (
        <>
          <InsightList
            title="반대 논거"
            rows={insights.objections}
            empty="라운드 2 반대가 아직 없습니다."
          />
          <InsightList
            title="위험"
            rows={insights.risks}
            empty="위험 항목이 없습니다."
          />
          <InsightList
            title="필요 데이터"
            rows={insights.needsData}
            empty="추가로 필요한 데이터가 없습니다."
          />
        </>
      ) : null}
      {sessionId && !loading && !error && insightsAreEmpty(insights) && turns.length > 0 ? (
        <section className="forest-panel">
          <h2 className="forest-panel-title">모을 항목이 없습니다</h2>
          <p className="forest-panel-copy">
            이 세션 발언에 반대·위험·필요 데이터가 없습니다.
          </p>
        </section>
      ) : null}
    </ForestFrame>
  );
}

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <ForestFrame
          title="AI 인사이트"
          subtitle="네 번째 모델을 부르지 않습니다. 세 입장에서 반대·위험·필요 데이터만 모읍니다."
          sidebar={<ForestPageNote>세션을 불러오는 중…</ForestPageNote>}
        >
          <p className="forest-panel-copy">세션을 불러오는 중…</p>
        </ForestFrame>
      }
    >
      <InsightsInner />
    </Suspense>
  );
}
