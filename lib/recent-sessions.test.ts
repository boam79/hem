import { describe, expect, it } from "vitest";
import { parseRecentSessions } from "@/lib/recent-sessions";

describe("parseRecentSessions", () => {
  it("keeps valid rows and drops junk", () => {
    expect(parseRecentSessions(null)).toEqual([]);
    expect(parseRecentSessions("{")).toEqual([]);
    expect(
      parseRecentSessions(
        JSON.stringify([
          { id: "uE7m2G", agenda: "백내장 검색광고 예산 30% 증액" },
          { id: 1 },
          null,
        ]),
      ),
    ).toEqual([
      { id: "uE7m2G", agenda: "백내장 검색광고 예산 30% 증액" },
    ]);
  });
});
