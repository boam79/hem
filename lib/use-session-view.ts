"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchSessionView,
  type SessionViewData,
} from "@/lib/session-view";
import { readRecentSessions } from "@/lib/recent-sessions";

export function useSessionView() {
  const search = useSearchParams();
  const queryId = search.get("id");
  const [data, setData] = useState<SessionViewData>({
    id: null,
    agenda: null,
    turns: [],
    memo: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<{ id: string; agenda: string }[]>([]);

  useEffect(() => {
    const stored = readRecentSessions();
    setRecent(stored);
    const id = queryId || stored[0]?.id || null;
    setData((prev) => ({ ...prev, id }));
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void fetchSessionView(id)
      .then((next) => {
        setData(next);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "세션을 찾지 못했습니다.");
        setData({ id, agenda: null, turns: [], memo: null });
      })
      .finally(() => setLoading(false));
  }, [queryId]);

  return { ...data, queryId, error, loading, recent };
}
