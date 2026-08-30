"use client";

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
