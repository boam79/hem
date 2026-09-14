import type { Category } from "@/lib/schema";

/** DB CHECK still requires a category. The home UI no longer asks; it is unused in prompts. */
export const DEFAULT_SESSION_CATEGORY: Category = "marketing";

export function shouldStartWithUploadedMetrics(
  metrics: unknown | null,
): boolean {
  return metrics != null;
}

export function debateStartBody(input: {
  agenda: string;
  category?: Category;
  metrics: unknown | null;
  useUploadedMetrics: boolean;
}): { agenda: string; category: Category; metrics?: unknown } {
  const body: { agenda: string; category: Category; metrics?: unknown } = {
    agenda: input.agenda.trim(),
    category: input.category ?? DEFAULT_SESSION_CATEGORY,
  };
  if (input.useUploadedMetrics && input.metrics != null) {
    body.metrics = input.metrics;
  }
  return body;
}
