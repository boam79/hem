import type { Persona } from "@/config/personas";

export function callOptions(p: Persona, temperature: number) {
  if (p.provider === "openai") {
    return {
      providerOptions: {
        openai: { reasoningEffort: "none" as const },
      },
    };
  }
  return { temperature };
}

export function structuredAbortMs(abortMs: number): number {
  const reserve = abortMs >= 16_000 ? 8_000 : Math.max(2_000, Math.floor(abortMs / 2));
  return Math.max(3_000, abortMs - reserve);
}
