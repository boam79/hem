export const BOARDROOM_DOCK_TABS = [
  {
    id: "minutes",
    label: "회의록",
    path: "/debate",
    sessionQuery: true,
  },
  {
    id: "metrics",
    label: "지표 대시보드",
    path: "/dashboard",
    sessionQuery: false,
  },
  {
    id: "scenario",
    label: "시나리오 결과",
    path: "/decision",
    sessionQuery: true,
  },
  {
    id: "insights",
    label: "AI 인사이트",
    path: "/insights",
    sessionQuery: true,
  },
] as const;

export type BoardroomDockId = (typeof BOARDROOM_DOCK_TABS)[number]["id"];

export function boardroomDockHrefs(sessionId: string | null): Record<
  BoardroomDockId,
  string
> {
  const q = sessionId ? `?id=${encodeURIComponent(sessionId)}` : "";
  return Object.fromEntries(
    BOARDROOM_DOCK_TABS.map((tab) => [
      tab.id,
      tab.sessionQuery ? `${tab.path}${q}` : tab.path,
    ]),
  ) as Record<BoardroomDockId, string>;
}

export function boardroomDockActive(pathname: string): BoardroomDockId | null {
  const hit = BOARDROOM_DOCK_TABS.find(
    (tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
  );
  return hit?.id ?? null;
}
