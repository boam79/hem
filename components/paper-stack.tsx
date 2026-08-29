"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { sheetCountFromUploads } from "@/lib/forest-ui";

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
}: {
  fileCount: number;
  burstId: number;
}) {
  const sheets = sheetCountFromUploads(fileCount);
  if (sheets <= 0) return null;
  const scale = Math.min(1.12, 0.82 + fileCount * 0.1);

  return (
    <div
      className="paper-pile-wrap"
      data-sheet-count={sheets}
      data-files={fileCount}
      aria-hidden
    >
      <div className="paper-pile-glow" />
      <div className="iso-drop-sheets">
        {Array.from({ length: sheets }, (_, i) => (
          <div
            key={`${burstId}-iso-${i}`}
            className="iso-sheet"
            style={
              {
                "--i": String(i),
                animationDelay: `${i * 68}ms`,
              } as CSSProperties
            }
          />
        ))}
        <div
          className="iso-sheet iso-sheet-top"
          style={
            {
              "--i": String(sheets),
              animationDelay: `${sheets * 68}ms`,
            } as CSSProperties
          }
        >
          <SpreadsheetGlyph />
        </div>
      </div>
      <div
        key={burstId}
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
    </div>
  );
}
