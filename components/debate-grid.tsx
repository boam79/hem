import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProviderBadge } from "@/components/provider-badge";
import { TurnCell } from "@/components/turn-cell";
import { PERSONAS } from "@/config/personas";
import type { DebateCell } from "@/lib/debate";
import { ROUND1_LABEL, ROUND2_LABEL } from "@/lib/ko-display";

export function DebateGrid({
  round1,
  round2,
  loadingRound = 0,
}: {
  round1: DebateCell[];
  round2: DebateCell[];
  loadingRound?: 0 | 1 | 2;
}) {
  if (loadingRound === 0 && round1.length === 0 && round2.length === 0) {
    return null;
  }
  return (
    <div className="mt-8 overflow-x-auto">
      <div className="grid min-w-[48rem] grid-cols-[5.5rem_repeat(3,minmax(0,1fr))] gap-3">
        <div />
        {PERSONAS.map((p) => (
          <Card key={p.key} size="sm">
            <CardHeader className="pb-0">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {p.name}
                <ProviderBadge provider={p.provider} />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        <div className="text-muted-foreground flex items-start pt-3 text-sm font-medium">
          {ROUND1_LABEL}
        </div>
        {PERSONAS.map((p) => (
          <Card key={`r1-${p.key}`}>
            <CardContent>
              <TurnCell
                cell={round1.find((c) => c.persona === p.key)}
                loading={loadingRound === 1}
              />
            </CardContent>
          </Card>
        ))}
        <div className="text-muted-foreground flex items-start pt-3 text-sm font-medium">
          {ROUND2_LABEL}
        </div>
        {PERSONAS.map((p) => (
          <Card key={`r2-${p.key}`}>
            <CardContent>
              <TurnCell
                cell={round2.find((c) => c.persona === p.key)}
                round2
                loading={loadingRound === 2 || loadingRound === 1}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
