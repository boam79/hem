import { runRound } from "@/lib/run-round";
import { RoundRequestSchema } from "@/lib/schema";

export const maxDuration = 60;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = RoundRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const result = await runRound(parsed.data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ round: parsed.data.round, turns: result.turns });
}
