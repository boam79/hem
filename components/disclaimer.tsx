export function Disclaimer({ extra }: { extra?: string }) {
  return (
    <p className="text-muted-foreground mb-2 text-sm">
      AI 토론 결과이며 결정은 사람이 합니다.
      {extra ? ` ${extra}` : null}
    </p>
  );
}
