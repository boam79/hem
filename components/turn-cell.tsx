import { koreanizePayload } from "@/lib/ko-display";
import { ProviderBadge } from "@/components/provider-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DebateCell } from "@/lib/debate";

export function TurnCell({
  cell,
  round2,
  loading,
}: {
  cell?: DebateCell;
  round2?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="발언 로딩">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }
  if (!cell) {
    return <p className="text-muted-foreground text-sm">대기</p>;
  }
  if (cell.status !== "ok") {
    return (
      <div className="space-y-2">
        <ProviderBadge provider={cell.provider} />
        <p className="text-sm">
          발언 불가
          {cell.error ? (
            <span className="text-muted-foreground mt-1 block text-xs">
              {cell.error}
            </span>
          ) : null}
        </p>
      </div>
    );
  }
  if (!cell.payload) return null;
  const p = koreanizePayload(cell.payload);
  return (
    <div className="space-y-2 text-sm">
      <ProviderBadge provider={cell.provider} />
      <p className="font-semibold leading-snug">{p.position}</p>
      <div className="flex flex-wrap gap-1">
        {p.evidence.map((item) => (
          <Badge key={item} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
      {p.risks.length > 0 ? (
        <ul className="text-muted-foreground list-disc pl-4 text-xs">
          {p.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {p.needs_data.length > 0 ? (
        <p className="text-xs">
          필요 데이터: {p.needs_data.join(" · ")}
        </p>
      ) : null}
      {round2 && p.objection ? (
        <p className="rounded-md bg-orange-50 px-2 py-1 text-xs">
          반대: {p.objection}
        </p>
      ) : null}
      {round2 && p.changed ? (
        <p className="rounded-md bg-slate-50 px-2 py-1 text-xs">
          변경: {p.changed}
        </p>
      ) : null}
    </div>
  );
}
