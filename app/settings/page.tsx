"use client";

import { CostPanel } from "@/components/cost-panel";
import { ForestFrame, ForestPageNote } from "@/components/forest-shell";
import { PersonaEditor } from "@/components/persona-editor";

export default function SettingsPage() {
  return (
    <ForestFrame
      title="설정"
      subtitle="페르소나를 고치고, 이번 달 API 사용량과 남은 예산을 봅니다."
      sidebar={
        <ForestPageNote>
          프로바이더와 모델 ID는 세 회사가 서로 다르도록 고정입니다. Boardroom
          사용량은 아래 집계이고, 계정 잔액은 각 사 콘솔에서 확인합니다.
        </ForestPageNote>
      }
    >
      <CostPanel showBudgetEditor />
      <PersonaEditor />
      <section className="forest-panel">
        <h2 className="forest-panel-title">호출 한도</h2>
        <ul className="settings-limits">
          <li>셀 abort 22초, 재시도 포함 28초 하드캡</li>
          <li>Route maxDuration 60초</li>
          <li>라운드 1은 30초 안에 3셀을 목표로 합니다</li>
        </ul>
      </section>
    </ForestFrame>
  );
}
