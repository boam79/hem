import { ProviderBadge } from "@/components/provider-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TurnCell } from "@/components/turn-cell";
import { PERSONAS } from "@/config/personas";
import type { DebateCell } from "@/lib/debate";
import { ROUND1_LABEL, ROUND2_LABEL } from "@/lib/ko-display";
import { glanceLine, glanceNote } from "@/lib/forest-ui";
import type { PersonaKey } from "@/lib/schema";

export function DebateGlance({
  round1,
  round2,
  loadingRound = 0,
  onRetry,
}: {
  round1: DebateCell[];
  round2: DebateCell[];
  loadingRound?: 0 | 1 | 2;
  onRetry?: (persona: PersonaKey, round: 1 | 2) => void;
}) {
  if (loadingRound === 0 && round1.length === 0 && round2.length === 0) {
    return null;
  }
  return (
    <div className="debate-glance" data-glance="true">
      {PERSONAS.map((p) => {
        const r1 = round1.find((c) => c.persona === p.key);
        const r2 = round2.find((c) => c.persona === p.key);
        const r1Loading = loadingRound === 1;
        const r2Loading =
          loadingRound === 2 || (loadingRound === 1 && !r2);
        const objection = glanceNote(r2?.payload?.objection);
        const changed = glanceNote(r2?.payload?.changed);
        return (
          <article key={p.key} className="glance-card">
            <header className="glance-head">
              <h3>{p.name}</h3>
              <ProviderBadge provider={p.provider} />
            </header>
            {onRetry && r1?.status === "failed" ? (
              <button
                type="button"
                className="glance-retry"
                onClick={() => onRetry(p.key, 1)}
              >
                1라운드 다시
              </button>
            ) : null}
            {onRetry && r2?.status === "failed" ? (
              <button
                type="button"
                className="glance-retry"
                onClick={() => onRetry(p.key, 2)}
              >
                2라운드 다시
              </button>
            ) : null}
            <div className="glance-row">
              <span className="glance-round-label">{ROUND1_LABEL}</span>
              {r1Loading ? (
                <GlanceSkeleton />
              ) : (
                <p className="glance-pos">{glanceLine(r1)}</p>
              )}
            </div>
            <div className="glance-row">
              <span className="glance-round-label">{ROUND2_LABEL}</span>
              {r2Loading ? (
                <GlanceSkeleton />
              ) : (
                <div>
                  <p className="glance-pos">{glanceLine(r2)}</p>
                  {objection ? (
                    <p className="glance-note">반대: {objection}</p>
                  ) : null}
                  {changed ? (
                    <p className="glance-note glance-note-muted">
                      변경: {changed}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            <details className="glance-details">
              <summary>근거·위험</summary>
              <div className="glance-full">
                <p className="glance-full-label">라운드 1</p>
                <TurnCell cell={r1} loading={r1Loading} />
                <p className="glance-full-label">라운드 2</p>
                <TurnCell cell={r2} round2 loading={r2Loading} />
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}

function GlanceSkeleton() {
  return (
    <div className="space-y-1.5" aria-busy="true" aria-label="발언 로딩">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}
