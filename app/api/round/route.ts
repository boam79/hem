import { retryPersonaTurn, runRound } from "@/lib/run-round";
import { RoundRequestSchema } from "@/lib/schema";
import { jsonFromCaught } from "@/lib/db-errors";

export const maxDuration = 60;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = RoundRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const result = parsed.data.persona
      ? await retryPersonaTurn({
          sessionId: parsed.data.sessionId,
          round: parsed.data.round,
          persona: parsed.data.persona,
        })
      : await runRound(parsed.data);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ round: parsed.data.round, turns: result.turns });
  } catch (err) {
    return jsonFromCaught(err);
  }
}
