import { apiErrorMessage } from "@/lib/api-errors";

export type ParsedMetricsUpload = {
  metrics: unknown;
  hospital: string;
  months: number;
};

export async function parseMetricsUploadFile(
  file: File,
): Promise<ParsedMetricsUpload> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/metrics/parse", {
    method: "POST",
    body,
  });
  const json = (await res.json()) as {
    metrics?: unknown;
    hospital?: string;
    months?: number;
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(apiErrorMessage(json));
  }
  return {
    metrics: json.metrics,
    hospital: json.hospital ?? "",
    months: json.months ?? 0,
  };
}
