import { describe, expect, it } from "vitest";
import type { DebateCell } from "@/lib/debate";
import { BOARDROOM_DOCK_TABS } from "@/lib/boardroom-dock";
import {
  BUBBLE_MAX,
  fileKind,
  forestNavActive,
  FOREST_NAV_LINKS,
  glanceLine,
  glanceNote,
  GLANCE_NOTE_MAX,
  GLANCE_POSITION_MAX,
  formatBytes,
  LOADING_BUBBLE,
  personaBubbleText,
  paperStackMode,
  sheetCountFromActivity,
  sheetCountFromUploads,
  sheetOpacity,
  stackMotion,
  stackUpDurationMs,
  shouldShowPersonaBubble,
  showTableWaitingPrompt,
  spokenFromStream,
  timelineStates,
  truncateBubble,
  IDLE_BUBBLES,
  UPLOAD_BUBBLES,
} from "@/lib/forest-ui";

describe("sheetCountFromUploads", () => {
  it("is empty until a file lands", () => {
    expect(sheetCountFromUploads(0)).toBe(0);
    expect(sheetCountFromUploads(-1)).toBe(0);
  });

  it("grows with each file and caps at 12", () => {
    expect(sheetCountFromUploads(1)).toBe(6);
    expect(sheetCountFromUploads(2)).toBe(8);
    expect(sheetCountFromUploads(3)).toBe(10);
    expect(sheetCountFromUploads(4)).toBe(12);
    expect(sheetCountFromUploads(20)).toBe(12);
  });
});

describe("paperStackMode", () => {
  it("waits until a file or a debate starts", () => {
    expect(
      paperStackMode({ fileCount: 0, loadingRound: 0, round1Count: 0 }),
    ).toBe("waiting");
    expect(
      paperStackMode({ fileCount: 1, loadingRound: 0, round1Count: 0 }),
    ).toBe("stacked");
    expect(
      paperStackMode({ fileCount: 0, loadingRound: 1, round1Count: 0 }),
    ).toBe("stacked");
  });
});

describe("sheetCountFromActivity", () => {
  it("shows one idle sheet until a file or a debate starts", () => {
    expect(sheetCountFromActivity(0, false)).toBe(1);
    expect(sheetCountFromActivity(0, true)).toBe(6);
    expect(sheetCountFromActivity(2, true)).toBe(8);
  });
});

describe("sheetOpacity", () => {
  it("keeps the first sheet solid and densifies sheets stacked on top", () => {
    expect(sheetOpacity(0, 1, true)).toBe(1);
    expect(sheetOpacity(0, 6, false)).toBe(1);
    expect(sheetOpacity(1, 6, false)).toBeCloseTo(0.856);
    expect(sheetOpacity(5, 6, false)).toBeCloseTo(1);
  });
});

describe("stackMotion", () => {
  it("pulses while waiting and stacks up after upload or debate", () => {
    expect(stackMotion(true)).toBe("pulse");
    expect(stackMotion(false)).toBe("stack-up");
    expect(stackUpDurationMs(6)).toBe(820);
    expect(stackUpDurationMs(1)).toBe(370);
  });
});

describe("personaBubbleText", () => {
  const empty: DebateCell[] = [];

  it("shows 03-style idle bubbles before a file lands", () => {
    const waiting = {
      persona: "cfo" as const,
      hasUploads: false,
      loadingRound: 0 as const,
      round1: empty,
      round2: empty,
    };
    expect(showTableWaitingPrompt(waiting)).toBe(true);
    expect(shouldShowPersonaBubble(waiting)).toBe(true);
    expect(personaBubbleText(waiting)).toBe(IDLE_BUBBLES.cfo);
  });

  it("shows persona bubbles after upload, matching the 03 table scene", () => {
    expect(
      shouldShowPersonaBubble({
        persona: "cfo",
        hasUploads: true,
        loadingRound: 0,
        round1: empty,
        round2: empty,
      }),
    ).toBe(true);
    expect(
      showTableWaitingPrompt({
        hasUploads: true,
        loadingRound: 0,
        round1: empty,
        round2: empty,
      }),
    ).toBe(false);
  });

  it("shows persona bubbles while a round runs and after cells land", () => {
    expect(
      shouldShowPersonaBubble({
        persona: "cfo",
        hasUploads: false,
        loadingRound: 1,
        round1: empty,
        round2: empty,
      }),
    ).toBe(true);
    const cell: DebateCell = {
      persona: "cfo",
      provider: "anthropic",
      status: "ok",
      payload: {
        position: "보류. 회수기간을 먼저 본다",
        evidence: ["x"],
        risks: [],
        needs_data: [],
      },
    };
    expect(
      shouldShowPersonaBubble({
        persona: "cfo",
        hasUploads: true,
        loadingRound: 0,
        round1: [cell],
        round2: empty,
      }),
    ).toBe(true);
  });

  it("uses the upload lines after a successful parse", () => {
    expect(
      personaBubbleText({
        persona: "cfo",
        hasUploads: true,
        loadingRound: 0,
        round1: empty,
        round2: empty,
      }),
    ).toBe(UPLOAD_BUBBLES.cfo);
    expect(
      personaBubbleText({
        persona: "mkt",
        hasUploads: true,
        loadingRound: 0,
        round1: empty,
        round2: empty,
      }),
    ).toBe(UPLOAD_BUBBLES.mkt);
    expect(
      personaBubbleText({
        persona: "md",
        hasUploads: true,
        loadingRound: 0,
        round1: empty,
        round2: empty,
      }),
    ).toBe(UPLOAD_BUBBLES.md);
  });

  it("shows streamed tokens while a round is running", () => {
    expect(
      personaBubbleText({
        persona: "cfo",
        hasUploads: true,
        loadingRound: 1,
        round1: [],
        round2: [],
        streamPreview: "보류. 회수기간을 먼저",
      }),
    ).toBe("보류. 회수기간을 먼저");
  });

  it("does not put raw JSON into the bubble", () => {
    expect(
      personaBubbleText({
        persona: "cfo",
        hasUploads: true,
        loadingRound: 1,
        round1: [],
        round2: [],
        streamPreview: '{"evidence":["x"],"position":"보류. 현금흐름을 먼저 본다"',
      }),
    ).toBe("보류. 현금흐름을 먼저 본다");
    expect(
      personaBubbleText({
        persona: "cfo",
        hasUploads: true,
        loadingRound: 1,
        round1: [],
        round2: [],
        streamPreview: '{"evidence":["x"]',
      }),
    ).toBe(LOADING_BUBBLE);
  });

  it("shows loading during round 1", () => {
    expect(
      personaBubbleText({
        persona: "md",
        hasUploads: true,
        loadingRound: 1,
        round1: empty,
        round2: empty,
      }),
    ).toBe(LOADING_BUBBLE);
  });

  it("truncates debate positions to 80 characters", () => {
    const long = "가".repeat(90);
    const cell: DebateCell = {
      persona: "cfo",
      provider: "anthropic",
      status: "ok",
      payload: {
        position: long,
        evidence: ["x"],
        risks: [],
        needs_data: [],
      },
    };
    const text = personaBubbleText({
      persona: "cfo",
      hasUploads: true,
      loadingRound: 0,
      round1: [cell],
      round2: empty,
    });
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBe(BUBBLE_MAX + 1);
    expect(truncateBubble(long).length).toBe(BUBBLE_MAX + 1);
  });
});

describe("spokenFromStream", () => {
  it("returns plain Korean as-is", () => {
    expect(spokenFromStream("보류. 현금흐름을 먼저 본다")).toBe(
      "보류. 현금흐름을 먼저 본다",
    );
  });

  it("pulls position out of a partial JSON stream", () => {
    expect(
      spokenFromStream(
        '{"evidence":["x"],"position":"보류. 현금흐름을 먼저 본다"',
      ),
    ).toBe("보류. 현금흐름을 먼저 본다");
  });

  it("returns nothing until a JSON position appears", () => {
    expect(spokenFromStream("{")).toBeUndefined();
    expect(spokenFromStream('{"evidence":[')).toBeUndefined();
  });
});

describe("timelineStates", () => {
  it("checks upload after files, review while round 1, result after session", () => {
    expect(
      timelineStates({
        hasUploads: true,
        loadingRound: 1,
        round1Count: 0,
        round2Count: 0,
        sessionId: "abc",
      }).upload,
    ).toBe("done");
    expect(
      timelineStates({
        hasUploads: true,
        loadingRound: 0,
        round1Count: 0,
        round2Count: 0,
        sessionId: null,
      }).review,
    ).toBe("active");
    expect(
      timelineStates({
        hasUploads: true,
        loadingRound: 0,
        round1Count: 3,
        round2Count: 3,
        sessionId: "abc",
      }).result,
    ).toBe("done");
  });
});

describe("file helpers", () => {
  it("classifies csv vs xlsx and formats sizes", () => {
    expect(fileKind("a.CSV")).toBe("csv");
    expect(fileKind("b.xlsx")).toBe("xlsx");
    expect(formatBytes(800)).toBe("800B");
    expect(formatBytes(2048)).toBe("2.0KB");
    expect(formatBytes(12_288)).toBe("12KB");
  });
});

describe("glanceLine", () => {
  it("summarizes waiting, failed, and long positions", () => {
    expect(glanceLine(undefined)).toBe("대기");
    expect(
      glanceLine({
        persona: "cfo",
        provider: "anthropic",
        status: "failed",
      }),
    ).toBe("발언 불가");
    const long = "가".repeat(90);
    const line = glanceLine({
      persona: "cfo",
      provider: "anthropic",
      status: "ok",
      payload: {
        position: long,
        evidence: [],
        risks: [],
        needs_data: [],
      },
    });
    expect(line.endsWith("…")).toBe(true);
    expect(line.length).toBe(GLANCE_POSITION_MAX + 1);
  });

  it("shows Korean metric names in glance copy", () => {
    expect(
      glanceLine({
        persona: "cfo",
        provider: "anthropic",
        status: "ok",
        payload: {
          position: "cash_net이 안정적입니다",
          evidence: ["inflow_ad 2026-01"],
          risks: [],
          needs_data: [],
        },
      }),
    ).toBe("순현금이 안정적입니다");
  });

  it("clips round-2 notes and skips blanks", () => {
    expect(glanceNote("")).toBeNull();
    expect(glanceNote("   ")).toBeNull();
    const note = glanceNote("가".repeat(80));
    expect(note?.endsWith("…")).toBe(true);
    expect(note?.length).toBe(GLANCE_NOTE_MAX + 1);
  });
});

describe("forestNavActive", () => {
  it("highlights one workspace item per path", () => {
    expect(forestNavActive("/", "home")).toBe(true);
    expect(forestNavActive("/", "files")).toBe(false);
    expect(forestNavActive("/", "minutes")).toBe(false);
    expect(forestNavActive("/debate", "minutes")).toBe(true);
    expect(forestNavActive("/files", "files")).toBe(true);
    expect(forestNavActive("/", "metrics")).toBe(false);
    expect(forestNavActive("/dashboard", "metrics")).toBe(true);
    expect(forestNavActive("/decision", "scenario")).toBe(true);
    expect(forestNavActive("/insights", "insights")).toBe(true);
    expect(forestNavActive("/settings", "settings")).toBe(true);
  });

  it("uses the same four meeting labels as the top menu", () => {
    expect(
      FOREST_NAV_LINKS.filter(
        (item) => item.id !== "home" && item.id !== "files",
      ).map((item) => item.label),
    ).toEqual(BOARDROOM_DOCK_TABS.map((tab) => tab.label));
  });
});
