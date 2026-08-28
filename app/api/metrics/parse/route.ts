import { MetricsParseError, parseMetricsUpload } from "@/lib/metrics-file";
import { metricsToMarkdownTable } from "@/lib/prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "invalid_metrics_file", message: "csv 또는 xlsx 파일을 선택하세요." },
      { status: 400 },
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const metrics = await parseMetricsUpload(buffer, file.name);
    const table = metricsToMarkdownTable(metrics);
    return Response.json({
      metrics,
      hospital: metrics.hospital.name,
      months: metrics.monthly.length,
      tableTokensHint: table.length,
    });
  } catch (e) {
    const message =
      e instanceof MetricsParseError
        ? e.message
        : e instanceof Error
          ? e.message
          : "파일을 읽지 못했습니다.";
    return Response.json(
      { error: "invalid_metrics_file", message },
      { status: 400 },
    );
  }
}
