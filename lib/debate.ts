import type { Provider, TurnPayload } from "@/lib/schema";

export type DebateCell = {
  persona: string;
  provider: Provider | string;
  status: string;
  payload?: TurnPayload | null;
  error?: string | null;
};

export type DebateTurnRow = DebateCell & {
  round: number;
};

export function cellsForRound(turns: DebateTurnRow[], round: number): DebateCell[] {
  return turns
    .filter((t) => t.round === round)
    .map(({ persona, provider, status, payload, error }) => ({
      persona,
      provider,
      status,
      payload,
      error,
    }));
}

export const DEMO_SHARE_ID = "w4demo";
