"use client";

import Image from "next/image";
import { sheetCountFromActivity, stackMotion } from "@/lib/forest-ui";

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
          key="idle-tile"
          src="/clay-paper-tile.png"
          alt=""
          width={520}
          height={175}
          className="clay-idle-tile"
          unoptimized
        />
      ) : (
        <div key={`pile-${burstId}`} className="clay-stack">
          <Image
            src="/clay-paper-stack.png?v=wood2"
            alt=""
            width={587}
            height={849}
            className="clay-stack-art"
            unoptimized
          />
        </div>
      )}
      {stacked ? (
        <>
          <Sparkle className="sparkle-1" />
          <Sparkle className="sparkle-2" />
          <span key={`burst-${burstId}`} className="sparkle-burst-group">
            <Sparkle className="sparkle-burst sparkle-b1" />
            <Sparkle className="sparkle-burst sparkle-b2" />
          </span>
        </>
      ) : null}
    </div>
  );
}
