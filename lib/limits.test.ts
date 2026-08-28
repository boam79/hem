import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_DURATION_SECONDS,
  PERSONA_ABORT_MS,
  PERSONA_RETRY_BUDGET_MS,
} from "@/config/limits";

describe("timeout literals", () => {
  it("keeps abort 22s, retry cap 28s, route maxDuration 60", () => {
    expect(PERSONA_ABORT_MS).toBe(22_000);
    expect(PERSONA_RETRY_BUDGET_MS).toBe(28_000);
    expect(MAX_DURATION_SECONDS).toBe(60);
    const roundRoute = readFileSync(
      resolve(process.cwd(), "app/api/round/route.ts"),
      "utf8",
    );
    expect(roundRoute).toMatch(/export const maxDuration = 60;/);
  });
});

describe("W3 failure handling literals", () => {
  it("schema retry uses temperature 0.2", () => {
    const llm = readFileSync(resolve(process.cwd(), "lib/llm.ts"), "utf8");
    expect(llm).toMatch(/once\(p, system, user, 0\.2, round, retryAbort\)/);
  });
});
