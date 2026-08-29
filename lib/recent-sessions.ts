export type RecentSession = {
  id: string;
  agenda: string;
  at: string;
};

export const RECENT_SESSION_KEY = "boardroom.recentSessions";
export const RECENT_SESSION_CAP = 8;

export function parseRecentSessions(raw: string | null): RecentSession[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is RecentSession =>
        Boolean(row) &&
        typeof row === "object" &&
        typeof (row as RecentSession).id === "string" &&
        typeof (row as RecentSession).agenda === "string",
    );
  } catch {
    return [];
  }
}

export function rememberSession(id: string, agenda: string): void {
  if (typeof window === "undefined") return;
  const next: RecentSession[] = [
    { id, agenda, at: new Date().toISOString() },
    ...readRecentSessions().filter((row) => row.id !== id),
  ].slice(0, RECENT_SESSION_CAP);
  window.localStorage.setItem(RECENT_SESSION_KEY, JSON.stringify(next));
}

export function readRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  return parseRecentSessions(window.localStorage.getItem(RECENT_SESSION_KEY));
}
