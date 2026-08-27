export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadMetrics, metricsToMarkdownTable } = await import("@/lib/prompt");
    const metrics = loadMetrics();
    metricsToMarkdownTable(metrics);
  }
}
