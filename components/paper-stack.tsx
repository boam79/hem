"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  clayRevealRem,
  sheetCountFromActivity,
  stackMotion,
  stackUpDurationMs,
} from "@/lib/forest-ui";

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
  const revealRem = clayRevealRem(sheets, waiting);

  return (
    <div
      className={waiting ? "paper-pile-wrap is-waiting" : "paper-pile-wrap"}
      data-stack={waiting ? "waiting" : "stacked"}
      data-motion={motion}
      data-sheet-count={sheets}
      data-files={fileCount}
      aria-hidden
      style={
        {
          "--stack-ms": `${stackUpDurationMs(sheets)}ms`,
          "--reveal-h": `${revealRem}rem`,
        } as CSSProperties
      }
    >
      <div className="paper-pile-glow" />
      <div className="clay-reveal">
        <Image
          src="/clay-paper-stack.png"
          alt=""
          width={587}
          height={849}
          className="clay-stack-art"
          unoptimized
        />
      </div>
      {stacked ? (
        <span key={`burst-${burstId}`} className="sparkle-burst-group">
          <Sparkle className="sparkle-burst sparkle-b1" />
          <Sparkle className="sparkle-burst sparkle-b2" />
          <Sparkle className="sparkle-burst sparkle-b3" />
        </span>
      ) : null}
    </div>
  );
}
