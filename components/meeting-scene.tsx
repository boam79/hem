"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { PaperStack } from "@/components/paper-stack";
import { PERSONAS } from "@/config/personas";
import type { DebateCell } from "@/lib/debate";
import {
  personaBubbleText,
  shouldShowPersonaBubble,
  showTableWaitingPrompt,
  WAITING_BUBBLE,
} from "@/lib/forest-ui";
import type { PersonaKey } from "@/lib/schema";

const BUBBLE_SLOT: Record<PersonaKey, string> = {
  cfo: "bubble-cfo",
  mkt: "bubble-mkt",
  md: "bubble-md",
};

const NAME_SLOT: Record<PersonaKey, string> = {
  cfo: "name-cfo",
  mkt: "name-mkt",
  md: "name-md",
};

export function MeetingScene({
  fileCount,
  burstId,
  hasUploads,
  loadingRound,
  round1,
  round2,
  names,
  streamPreview,
  onLeave,
}: {
  fileCount: number;
  burstId: number;
  hasUploads: boolean;
  loadingRound: 0 | 1 | 2;
  round1: DebateCell[];
  round2: DebateCell[];
  names?: Partial<Record<PersonaKey, string>>;
  streamPreview?: Partial<Record<PersonaKey, string>>;
  onLeave: () => void;
}) {
  return (
    <div className="forest-scene-frame">
      <div className="forest-scene">
        <Image
          src="/forest-room.png"
          alt="포레스트 병원 회의실 — 너구리 재무이사, 여우 마케팅실장, 고양이 진료원장"
          fill
          sizes="(max-width: 960px) 100vw, min(1200px, calc(100vw - 300px))"
          className="forest-scene-art"
          priority
          unoptimized
        />
        {PERSONAS.map((p) => (
          <div key={`name-${p.key}`} className={`char-name ${NAME_SLOT[p.key]}`}>
            {names?.[p.key] ?? p.name}
          </div>
        ))}
        {showTableWaitingPrompt({
          hasUploads,
          loadingRound,
          round1,
          round2,
        }) ? (
          <div className="table-waiting" data-table-prompt="true">
            {WAITING_BUBBLE}
          </div>
        ) : null}
        {PERSONAS.map((p) => {
          const opts = {
            persona: p.key,
            hasUploads,
            loadingRound,
            round1,
            round2,
            streamPreview: streamPreview?.[p.key],
          };
          if (!shouldShowPersonaBubble(opts)) return null;
          return (
            <div
              key={`bubble-${p.key}`}
              className={`speech-bubble ${BUBBLE_SLOT[p.key]}`}
              data-bubble={p.key}
            >
              {personaBubbleText(opts)}
            </div>
          );
        })}
        <div className="paper-pile-anchor">
          <PaperStack fileCount={fileCount} burstId={burstId} />
        </div>
        <button type="button" className="leave-meeting-btn" onClick={onLeave}>
          <LogOut className="size-3.5" strokeWidth={2.4} />
          회의 나가기
        </button>
      </div>
    </div>
  );
}
