"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { PaperStack } from "@/components/paper-stack";
import type { DebateCell } from "@/lib/debate";
import {
  paperStackMode,
  showTableWaitingPrompt,
  WAITING_BUBBLE,
} from "@/lib/forest-ui";
import type { PersonaKey } from "@/lib/schema";

export function MeetingScene({
  fileCount,
  burstId,
  hasUploads,
  loadingRound,
  round1,
  round2,
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
        <div className="paper-pile-anchor">
          <PaperStack
            fileCount={fileCount}
            burstId={burstId}
            waiting={
              paperStackMode({
                fileCount,
                loadingRound,
                round1Count: round1.length,
              }) === "waiting"
            }
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
      </div>
    </div>
  );
}
