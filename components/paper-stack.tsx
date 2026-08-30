"use client";

import Image from "next/image";
import { sheetCountFromActivity, stackMotion } from "@/lib/forest-ui";

const STACK_SRC = "/clay-paper-stack.png?v=02match";
const STACK_W = 787;
const STACK_H = 975;

function Sparkle({ className }: { className: string }) {
  return <span className={`sparkle ${className}`} />;
}

export function PaperStack({
  fileCount,
  burstId,
  waiting,
}: {
  fileCount: number;
  burstId: number;
  waiting: boolean;
}) {
  const stacked = !waiting;
  const sheets = sheetCountFromActivity(fileCount, stacked);
  const motion = stackMotion(waiting);

  return (
    <div
      className={waiting ? "paper-pile-wrap is-waiting" : "paper-pile-wrap"}
      data-stack={waiting ? "waiting" : "stacked"}
      data-motion={motion}
      data-sheet-count={sheets}
      data-files={fileCount}
      aria-hidden
    >
      <div className="paper-pile-glow" />
      {waiting ? (
        <Image
          key="idle-stack"
          src={STACK_SRC}
          alt=""
          width={STACK_W}
          height={STACK_H}
          className="clay-idle-tile"
          unoptimized
        />
      ) : (
        <div key={`pile-${burstId}`} className="clay-stack">
          <Image
            src={STACK_SRC}
            alt=""
            width={STACK_W}
            height={STACK_H}
            className="clay-stack-art"
            unoptimized
          />
        </div>
      )}
      {stacked ? (
        <>
          <Sparkle className="sparkle-1" />
          <Sparkle className="sparkle-2" />
          <Sparkle className="sparkle-3" />
          <Sparkle className="sparkle-4" />
          <span key={`burst-${burstId}`} className="sparkle-burst-group">
            <Sparkle className="sparkle-burst sparkle-b1" />
            <Sparkle className="sparkle-burst sparkle-b2" />
          </span>
        </>
      ) : null}
    </div>
  );
}
