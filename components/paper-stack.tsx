"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  sheetCountFromActivity,
  sheetOpacity,
  stackMotion,
  stackUpDurationMs,
  CLAY_TILE_LIFT_PX,
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
          "--tile-lift": `${CLAY_TILE_LIFT_PX}px`,
        } as CSSProperties
      }
    >
      <div className="paper-pile-glow" />
      <div className="clay-tiles">
        {Array.from({ length: sheets }, (_, i) => (
          <Image
            key={waiting ? "idle-tile" : `${burstId}-tile-${i}`}
            src="/clay-paper-tile.png"
            alt=""
            width={520}
            height={175}
            className={i === 0 ? "clay-tile is-base" : "clay-tile"}
            unoptimized
            style={
              {
                "--i": String(i),
                "--sheet-opacity": String(sheetOpacity(i, sheets, waiting)),
                animationDelay: waiting || i === 0 ? "0ms" : `${i * 95}ms`,
              } as CSSProperties
            }
          />
        ))}
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
