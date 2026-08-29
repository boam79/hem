"use client";

import type { CSSProperties } from "react";
import {
  sheetCountFromActivity,
  sheetOpacity,
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
        } as CSSProperties
      }
    >
      <div className="paper-pile-glow" />
      <div className={waiting ? "iso-drop-sheets is-idle" : "iso-drop-sheets"}>
        {Array.from({ length: sheets }, (_, i) => (
          <div
            key={waiting ? "idle-sheet" : `${burstId}-iso-${i}`}
            className="iso-sheet"
            style={
              {
                "--i": String(i),
                "--sheet-opacity": String(sheetOpacity(i, sheets, waiting)),
                animationDelay: waiting ? "0ms" : `${i * 110}ms`,
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
