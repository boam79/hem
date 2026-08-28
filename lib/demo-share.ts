import demoShare from "@/data/demo-share.json";
import { DEMO_SHARE_ID, type DebateCell } from "@/lib/debate";
import { MemoSchema, type Memo } from "@/lib/schema";

export { DEMO_SHARE_ID };

export const DEMO_REPLAY_STEP_MS = 800;

export function demoAgenda(): string {
  return demoShare.agenda;
}

export function demoDisclaimer(): string {
  return demoShare.disclaimer;
}

export function demoCells(round: 1 | 2): DebateCell[] {
  return demoShare.turns
    .filter((turn) => turn.round === round)
    .map((turn) => ({
      persona: turn.persona,
      provider: turn.provider,
      status: turn.status,
      payload: turn.payload,
    }));
}

export function demoMemo(): Memo {
  return MemoSchema.parse(demoShare.memo);
}
