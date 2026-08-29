"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { sheetCountFromActivity } from "@/lib/forest-ui";

function Sparkle({ className }: { className: string }) {
  return <span className={`sparkle ${className}`} />;
}

function SpreadsheetGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="iso-top-icon" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#3DCC8A" />
      <path
        d="M9 11h14M9 16h14M9 21h14M14 9v14"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
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
  const scale = stacked
    ? Math.min(1.12, 0.82 + Math.max(fileCount, 1) * 0.1)
    : 0.92;

  return (
    <div
      className={waiting ? "paper-pile-wrap is-waiting" : "paper-pile-wrap"}
      data-stack={waiting ? "waiting" : "stacked"}
      data-sheet-count={sheets}
      data-files={fileCount}
      aria-hidden
    >
      <div className="paper-pile-glow" />
      {stacked ? (
        <div className="iso-drop-sheets">
          {Array.from({ length: sheets }, (_, i) => (
            <div
              key={`${burstId}-iso-${i}`}
              className="iso-sheet"
              style={
                {
                  "--i": String(i),
                  animationDelay: `${i * 110}ms`,
                } as CSSProperties
              }
            />
          ))}
          <div
            className="iso-sheet iso-sheet-top"
            style={
              {
                "--i": String(sheets),
                animationDelay: `${sheets * 110}ms`,
              } as CSSProperties
            }
          >
            <SpreadsheetGlyph />
          </div>
        </div>
      ) : null}
      <div
        key={waiting ? "idle" : burstId}
        className="clay-stack"
        style={{ "--stack-scale": String(scale) } as CSSProperties}
      >
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
        <>
          <Sparkle className="sparkle-1" />
          <Sparkle className="sparkle-2" />
          <Sparkle className="sparkle-3" />
          <Sparkle className="sparkle-4" />
          <span key={`burst-${burstId}`} className="sparkle-burst-group">
            <Sparkle className="sparkle-burst sparkle-b1" />
            <Sparkle className="sparkle-burst sparkle-b2" />
            <Sparkle className="sparkle-burst sparkle-b3" />
            <Sparkle className="sparkle-burst sparkle-b4" />
            <Sparkle className="sparkle-burst sparkle-b5" />
            <Sparkle className="sparkle-burst sparkle-b6" />
          </span>
        </>
      ) : null}
    </div>
  );
}
