import { Badge } from "@/components/ui/badge";
import type { Provider } from "@/lib/schema";

const STYLES: Record<
  Provider,
  { label: string; className: string }
> = {
  anthropic: {
    label: "Anthropic",
    className: "border-transparent bg-amber-100 text-amber-950",
  },
  openai: {
    label: "OpenAI",
    className: "border-transparent bg-emerald-100 text-emerald-950",
  },
  google: {
    label: "Google",
    className: "border-transparent bg-sky-100 text-sky-950",
  },
};

export function ProviderBadge({ provider }: { provider: string }) {
  const style = STYLES[provider as Provider];
  if (!style) {
    return <Badge variant="outline">{provider}</Badge>;
  }
  return (
    <Badge variant="outline" className={style.className}>
      {style.label}
    </Badge>
  );
}
