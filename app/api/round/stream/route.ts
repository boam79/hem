import { sseData, type RoundStreamEvent } from "@/lib/sse";
import { runRound } from "@/lib/run-round";
import { RoundRequestSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = RoundRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: RoundStreamEvent) => {
        controller.enqueue(encoder.encode(sseData(event)));
      };
      try {
        const result = await runRound({
          sessionId: parsed.data.sessionId,
          round: parsed.data.round,
          onDelta: (persona, text) => {
            send({ type: "delta", persona, text });
          },
        });
        if (!result.ok) {
          send({ type: "error", error: result.error });
          return;
        }
        for (const turn of result.turns) {
          send({ type: "cell", persona: turn.persona, status: turn.status });
        }
        send({ type: "done", round: parsed.data.round, turns: result.turns });
      } catch (err) {
        send({
          type: "error",
          error: "round_failed",
          message: err instanceof Error ? err.message : "round failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
