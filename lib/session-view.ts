import demoShare from "@/data/demo-share.json";
import { DEMO_SHARE_ID, type DebateTurnRow } from "@/lib/debate";
import { apiErrorMessage } from "@/lib/api-errors";
import { MemoSchema, type Memo } from "@/lib/schema";

export type SessionViewData = {
  id: string | null;
  agenda: string | null;
  turns: DebateTurnRow[];
  memo: Memo | null;
};

export function demoSessionView(): SessionViewData {
  const parsed = MemoSchema.safeParse(demoShare.memo);
  return {
    id: DEMO_SHARE_ID,
    agenda: demoShare.agenda,
    turns: demoShare.turns as DebateTurnRow[],
    memo: parsed.success ? parsed.data : null,
  };
}

export async function fetchSessionView(id: string): Promise<SessionViewData> {
  if (id === DEMO_SHARE_ID) return demoSessionView();
  const res = await fetch(`/api/session?id=${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(apiErrorMessage(json, "세션을 찾지 못했습니다."));
  }
  const body = json as {
    session: { agenda: string; memo?: unknown };
    turns?: DebateTurnRow[];
  };
  const parsed = body.session.memo
    ? MemoSchema.safeParse(body.session.memo)
    : null;
  return {
    id,
    agenda: body.session.agenda,
    turns: body.turns ?? [],
    memo: parsed?.success ? parsed.data : null,
  };
}
