"use client";

import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import { ProviderBadge } from "@/components/provider-badge";
import { PERSONAS } from "@/config/personas";

export default function SettingsPage() {
  return (
    <ForestFrame
      title="설정"
      subtitle="페르소나와 호출 한도를 읽기 전용으로 보여 줍니다."
      sidebar={
        <ForestPageNote>
          페르소나 편집 UI는 MVP 범위 밖입니다. 모델 ID는 코드의 확정값을
          그대로 표시합니다.
        </ForestPageNote>
      }
    >
      <section className="forest-panel">
        <h2 className="forest-panel-title">세 페르소나</h2>
        <p className="forest-panel-copy">
          세 회사의 모델이 서로 다른 입장을 냅니다. 프로바이더를 같게 두면
          빌드가 실패합니다.
        </p>
        <div className="settings-persona-grid">
          {PERSONAS.map((p) => (
            <article key={p.key} className="settings-persona">
              <header className="glance-head">
                <h3>{p.name}</h3>
                <ProviderBadge provider={p.provider} />
              </header>
              <p className="settings-model">{p.modelId}</p>
              <p className="forest-panel-copy">{p.role}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="forest-panel">
        <h2 className="forest-panel-title">호출 한도</h2>
        <ul className="settings-limits">
          <li>셀 abort 22초, 재시도 포함 28초 하드캡</li>
          <li>Route maxDuration 60초</li>
          <li>라운드 1은 30초 안에 3셀을 목표로 합니다</li>
        </ul>
      </section>
      <section className="forest-panel">
        <h2 className="forest-panel-title">편집하지 않는 것</h2>
        <p className="forest-panel-copy">
          페르소나 편집, 인증·RLS, 비용 대시보드, 토큰 스트리밍은 제공하지
          않습니다.
        </p>
      </section>
    </ForestFrame>
  );
}
