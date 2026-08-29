import type { UploadedMetricsFile } from "@/lib/forest-ui";

export const METRICS_UPLOAD_KEY = "boardroom.metricsUpload";

export type MetricsUploadStore = {
  metrics: unknown;
  label: string;
  files: UploadedMetricsFile[];
};

function isUploadedFile(row: unknown): row is UploadedMetricsFile {
  if (!row || typeof row !== "object") return false;
  const file = row as UploadedMetricsFile;
  return (
    typeof file.id === "string" &&
    typeof file.name === "string" &&
    typeof file.uploadedAt === "string" &&
    typeof file.sizeLabel === "string" &&
    (file.kind === "csv" || file.kind === "xlsx")
  );
}

export function parseMetricsUploadStore(
  raw: string | null,
): MetricsUploadStore | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as MetricsUploadStore;
    if (!Array.isArray(row.files) || typeof row.label !== "string") return null;
    const files = row.files.filter(isUploadedFile);
    if (files.length === 0) return null;
    return { metrics: row.metrics, label: row.label, files };
  } catch {
    return null;
  }
}

export function saveMetricsUploadStore(store: MetricsUploadStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(METRICS_UPLOAD_KEY, JSON.stringify(store));
}

export function readMetricsUploadStore(): MetricsUploadStore | null {
  if (typeof window === "undefined") return null;
  return parseMetricsUploadStore(
    window.localStorage.getItem(METRICS_UPLOAD_KEY),
  );
}

export function clearMetricsUploadStore(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(METRICS_UPLOAD_KEY);
}
