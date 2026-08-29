import { apiErrorMessage } from "@/lib/api-errors";
import type { DebateCell } from "@/lib/debate";
import { applyRoundStreamEvents, takeSseEvents } from "@/lib/sse";

export class RoundClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoundClientError";
  }
}

export async function readRoundTurns(
  sessionId: string,
  round: 1 | 2,
  onDelta: (persona: string, chunk: string) => void,
  isCurrent: () => boolean = () => true,
): Promise<DebateCell[]> {
  const res = await fetch("/api/round/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, round }),
  });
  if (!res.ok || !res.body) {
    return postRoundJson(sessionId, round);
  }
  return readSseBody(res.body, onDelta, isCurrent);
}

async function postRoundJson(
  sessionId: string,
  round: 1 | 2,
): Promise<DebateCell[]> {
  const r = await fetch("/api/round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, round }),
  });
  const json = await r.json();
  if (!r.ok) throw new RoundClientError(apiErrorMessage(json));
  return json.turns as DebateCell[];
}

async function readSseBody(
  body: ReadableStream<Uint8Array>,
  onDelta: (persona: string, chunk: string) => void,
  isCurrent: () => boolean,
): Promise<DebateCell[]> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let preview: Record<string, string> = {};
  let turns: unknown[] | null = null;
  try {
    while (true) {
      if (!isCurrent()) {
        await reader.cancel();
        throw new Error("aborted");
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const taken = takeSseEvents(buffer);
      buffer = taken.rest;
      const folded = applyRoundStreamEvents(taken.events, preview);
      preview = folded.preview;
      for (const ev of taken.events) {
        if (ev.type === "delta") onDelta(ev.persona, ev.text);
      }
      if (folded.error) {
        const errEv = taken.events.find((ev) => ev.type === "error");
        throw new RoundClientError(
          apiErrorMessage(
            errEv && errEv.type === "error"
              ? errEv
              : { error: folded.error },
          ),
        );
      }
      if (folded.turns) turns = folded.turns;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released after cancel */
    }
  }
  if (!turns) {
    throw new RoundClientError("라운드 스트림이 끝나기 전에 끊겼습니다.");
  }
  return turns as DebateCell[];
}
