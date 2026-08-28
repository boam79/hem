import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const protocol = JSON.parse(
  readFileSync(resolve(process.cwd(), "data/eval-protocol.json"), "utf8"),
) as {
  runsPerAgenda: number;
  agendas: { label: string; category: string; agenda: string }[];
};

describe("W3 eval protocol", () => {
  it("requires 5 agendas × 10 runs matching PRD §15", () => {
    expect(protocol.runsPerAgenda).toBe(10);
    expect(protocol.agendas).toHaveLength(5);
    expect(protocol.agendas.map((a) => a.label)).toEqual([
      "투자",
      "마케팅",
      "인력",
      "가격",
      "해외환자",
    ]);
  });

  it("eval script defaults to protocol scale and rejects localhost", () => {
    const src = readFileSync(
      resolve(process.cwd(), "scripts/eval-agendas.mjs"),
      "utf8",
    );
    expect(src).toMatch(/runsPerAgenda/);
    expect(src).toMatch(/localhost\|127\\?\.0\\?\.0\\?\.1/);
    const r = spawnSync(process.execPath, ["scripts/eval-agendas.mjs"], {
      env: { ...process.env, APP_URL: "http://localhost:3000" },
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/HTTPS/);
  });
});

describe("W3 keepalive schedule", () => {
  it("GitHub Actions and Vercel Cron are twice weekly Mon/Thu 03:00 UTC", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/keepalive.yml"),
      "utf8",
    );
    const vercel = JSON.parse(
      readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
    ) as { crons: { path: string; schedule: string }[] };
    expect(workflow).toMatch(/cron: "0 3 \* \* 1,4"/);
    expect(vercel.crons).toEqual([
      { path: "/api/keepalive", schedule: "0 3 * * 1,4" },
    ]);
  });
});
