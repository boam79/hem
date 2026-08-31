"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { BoardroomDock } from "@/components/forest-shell";
import { PaperStack } from "@/components/paper-stack";
import { PERSONAS } from "@/config/personas";
import type { DebateCell } from "@/lib/debate";
import {
  personaBubbleText,
  paperStackMode,
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

const ROLE_CHIP: Record<PersonaKey, string> = {
  cfo: "CFO",
  mkt: "마케터",
  md: "진료진",
};

function SpeechBubble({
  className,
  children,
  "data-bubble": dataBubble,
}: {
  className: string;
  children: ReactNode;
  "data-bubble"?: PersonaKey;
}) {
  return (
    <div className={`speech-bubble ${className}`} data-bubble={dataBubble}>
      <span className="speech-bubble-text">{children}</span>
    </div>
  );
}

export function MeetingScene({
  fileCount,
  burstId,
  hasUploads,
  loadingRound,
  round1,
  round2,
  streamPreview,
  sessionId,
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
  sessionId: string | null;
  onLeave: () => void;
}) {
  const waiting =
    paperStackMode({
      fileCount,
      loadingRound,
      round1Count: round1.length,
    }) === "waiting";

  return (
    <div className="forest-scene-frame">
      <div className="forest-scene">
        <Image
          src="/boardroom-room.png?v=03match20"
          alt="Boardroom 회의실 — 재무이사, 마케팅실장, 진료원장"
          fill
          sizes="100vw"
          className="forest-scene-art"
          priority
          unoptimized
        />
        {PERSONAS.map((p) => (
          <span
            key={`role-${p.key}`}
            className={`role-chip role-chip-${p.key}`}
            data-role-chip={p.key}
          >
            {ROLE_CHIP[p.key]}
          </span>
        ))}
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
            <SpeechBubble
              key={`bubble-${p.key}`}
              className={BUBBLE_SLOT[p.key]}
              data-bubble={p.key}
            >
              {personaBubbleText(opts)}
            </SpeechBubble>
          );
        })}
        <div className="paper-pile-anchor">
          <PaperStack
            fileCount={fileCount}
            burstId={burstId}
            waiting={waiting}
          />
          {showTableWaitingPrompt({
            hasUploads,
            loadingRound,
            round1,
            round2,
          }) ? (
            <p className="table-waiting-label" data-table-prompt="true">
              {WAITING_BUBBLE}
            </p>
          ) : null}
        </div>
        <button type="button" className="leave-meeting-btn" onClick={onLeave}>
          <LogOut className="size-3.5" strokeWidth={2.4} />
          회의 나가기
        </button>
        <BoardroomDock sessionId={sessionId} />
      </div>
    </div>
  );
}
