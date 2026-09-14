import { describe, expect, it } from "vitest";
import { DEMO_SHARE_ID } from "@/lib/debate";
import { demoSessionView } from "@/lib/session-view";

describe("session view", () => {
  it("loads the demo share without calling the API", () => {
    const view = demoSessionView();
    expect(view.id).toBe(DEMO_SHARE_ID);
    expect(view.agenda?.length).toBeGreaterThan(10);
    expect(view.turns.length).toBeGreaterThan(0);
    expect(view.memo?.consensus.length).toBeGreaterThan(0);
  });
});
