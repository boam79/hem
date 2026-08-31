import type { Category } from "@/lib/schema";

export function debateStartBody(input: {
  agenda: string;
  category: Category;
  metrics: unknown | null;
  useUploadedMetrics: boolean;
}): { agenda: string; category: Category; metrics?: unknown } {
  const body: { agenda: string; category: Category; metrics?: unknown } = {
    agenda: input.agenda.trim(),
    category: input.category,
  };
  if (input.useUploadedMetrics && input.metrics != null) {
    body.metrics = input.metrics;
  }
  return body;
}
