import { describe, expect, it } from "vitest";
import { retryTurnGate } from "@/lib/round-retry";

describe("retryTurnGate", () => {
  it("only retries a failed cell", () => {
    expect(retryTurnGate(undefined).ok).toBe(false);
    expect(retryTurnGate("ok")).toEqual({
      ok: false,
      status: 409,
      error: "turn_already_ok",
    });
    expect(retryTurnGate("failed")).toEqual({ ok: true });
  });
});
