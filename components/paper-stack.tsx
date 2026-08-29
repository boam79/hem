"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  clayIdleTileWidthRem,
  clayStackFromHeightRem,
  clayStackHeightRem,
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
          "--sheet-count": String(sheets),
          "--tile-w": `${clayIdleTileWidthRem()}rem`,
          "--from-h": `${clayStackFromHeightRem()}rem`,
          "--reveal-h": `${clayStackHeightRem(sheets)}rem`,
        } as CSSProperties
      }
    >
      <div className="paper-pile-glow" />
      {waiting ? (
        <Image
          key="idle-tile"
          src="/clay-paper-tile.png"
          alt=""
          width={520}
          height={175}
          className="clay-idle-tile"
          unoptimized
        />
      ) : (
        <div key={`pile-${burstId}`} className="clay-pile">
          <Image
            src="/clay-paper-stack.png"
            alt=""
            width={587}
            height={849}
            className="clay-pile-img"
            unoptimized
          />
        </div>
      )}
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
