import Link from "next/link";

export function SessionLoadError({
  error,
  demoHref,
  demoLabel = "데모 결과 보기",
}: {
  error: string;
  demoHref: string;
  demoLabel?: string;
}) {
  return (
    <section className="forest-panel" data-session-error="true">
      <p className="text-destructive text-sm">{error}</p>
      <p className="forest-panel-copy">
        <Link className="forest-dummy-link" href={demoHref}>
          {demoLabel}
        </Link>
      </p>
    </section>
  );
}
