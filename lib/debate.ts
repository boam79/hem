import type { Provider, TurnPayload } from "@/lib/schema";

export type DebateCell = {
  persona: string;
  provider: Provider | string;
  status: string;
  payload?: TurnPayload | null;
  error?: string | null;
};

export const DEMO_SHARE_ID = "w4demo";
