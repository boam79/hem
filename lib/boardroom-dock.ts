export function boardroomDockHrefs(sessionId: string | null): {
  minutes: string;
  metrics: string;
  scenario: string;
  insights: string;
} {
  const q = sessionId ? `?id=${encodeURIComponent(sessionId)}` : "";
  return {
    minutes: `/debate${q}`,
    metrics: "/dashboard",
    scenario: `/decision${q}`,
    insights: `/insights${q}`,
  };
}

export function boardroomDockActive(
  pathname: string,
): "minutes" | "metrics" | "scenario" | "insights" | null {
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/debate")) return "minutes";
  if (pathname.startsWith("/dashboard")) return "metrics";
  if (pathname.startsWith("/decision")) return "scenario";
  return null;
}
