import type { PersonaKey } from "@/lib/schema";

export function retryTurnGate(
  existingStatus: string | undefined,
): { ok: true } | { ok: false; status: number; error: string } {
  if (!existingStatus) {
    return { ok: false, status: 404, error: "turn_not_found" };
  }
  if (existingStatus === "ok") {
    return { ok: false, status: 409, error: "turn_already_ok" };
  }
  return { ok: true };
}

export function isRetryPersona(value: string | undefined): value is PersonaKey {
  return value === "cfo" || value === "mkt" || value === "md";
}
