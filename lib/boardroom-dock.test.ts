import { describe, expect, it } from "vitest";
import { boardroomDockActive, boardroomDockHrefs, BOARDROOM_DOCK_TABS } from "@/lib/boardroom-dock";

describe("boardroomDockHrefs", () => {
  it("sends the four meeting views to four different paths", () => {
    const hrefs = boardroomDockHrefs(null);
    const paths = Object.values(hrefs);
    expect(new Set(paths).size).toBe(4);
    expect(hrefs.minutes).toBe("/debate");
    expect(hrefs.metrics).toBe("/dashboard");
    expect(hrefs.scenario).toBe("/decision");
    expect(hrefs.insights).toBe("/insights");
  });

  it("keeps a session id on minutes, scenario, and insights only", () => {
    const hrefs = boardroomDockHrefs("uE7m2G");
    expect(hrefs.minutes).toBe("/debate?id=uE7m2G");
    expect(hrefs.metrics).toBe("/dashboard");
    expect(hrefs.scenario).toBe("/decision?id=uE7m2G");
    expect(hrefs.insights).toBe("/insights?id=uE7m2G");
  });

  it("names the four tabs 회의록, 지표 대시보드, 시나리오 결과, AI 인사이트", () => {
    expect(BOARDROOM_DOCK_TABS.map((tab) => tab.label)).toEqual([
      "회의록",
      "지표 대시보드",
      "시나리오 결과",
      "AI 인사이트",
    ]);
  });
});

describe("boardroomDockActive", () => {
  it("maps each product page to one meeting view", () => {
    expect(boardroomDockActive("/debate")).toBe("minutes");
    expect(boardroomDockActive("/dashboard")).toBe("metrics");
    expect(boardroomDockActive("/decision")).toBe("scenario");
    expect(boardroomDockActive("/insights")).toBe("insights");
    expect(boardroomDockActive("/")).toBeNull();
  });
});
