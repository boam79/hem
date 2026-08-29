export type RoundStreamEvent =
  | { type: "delta"; persona: string; text: string }
  | { type: "cell"; persona: string; status: string }
  | { type: "done"; round: 1 | 2; turns: unknown[] }
  | { type: "error"; error: string; message?: string };

export function sseData(event: RoundStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function takeSseEvents(
  buffer: string,
): { events: RoundStreamEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: RoundStreamEvent[] = [];
  for (const part of parts) {
    const line = part
      .split("\n")
      .find((row) => row.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as RoundStreamEvent);
    } catch {
      /* skip malformed */
    }
  }
  return { events, rest };
}

export function applyRoundStreamEvents(
  events: RoundStreamEvent[],
  preview: Record<string, string>,
): {
  preview: Record<string, string>;
  turns: unknown[] | null;
  error: string | null;
} {
  const next = { ...preview };
  let turns: unknown[] | null = null;
  let error: string | null = null;
  for (const ev of events) {
    if (ev.type === "delta") {
      next[ev.persona] = (next[ev.persona] ?? "") + ev.text;
    } else if (ev.type === "done") {
      turns = ev.turns;
    } else if (ev.type === "error") {
      error = ev.error;
    }
  }
  return { preview: next, turns, error };
}
