#!/usr/bin/env node
/**
 * W3 eval runner. HTTPS only. Requires /api/health all true.
 * PRD §15: 5 agendas × 10 runs of round 1+2.
 * Usage: APP_URL=https://boardroom-six-delta.vercel.app node scripts/eval-agendas.mjs
 * IP hour cap 10 / daily cap 100: waits until the next UTC hour on 429.
 * Does not use localhost.
 */
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const protocol = JSON.parse(
  readFileSync(resolve(root, "data/eval-protocol.json"), "utf8"),
);

const appUrl = (process.env.APP_URL || "https://boardroom-six-delta.vercel.app").replace(
  /\/$/,
  "",
);
const runs = Number(process.env.RUNS || protocol.runsPerAgenda);

if (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(appUrl)) {
  console.error("APP_URL must be deployed HTTPS");
  process.exit(1);
}

if (runs !== protocol.runsPerAgenda && process.env.ALLOW_PARTIAL_RUNS !== "1") {
  console.error(
    `RUNS must be ${protocol.runsPerAgenda} (PRD §15). Set ALLOW_PARTIAL_RUNS=1 only for smoke.`,
  );
  process.exit(1);
}

const outJsonl =
  process.env.EVAL_JSONL ||
  resolve(root, "doc/progress/2026-08-28-w3-eval.jsonl");
const outSummary =
  process.env.EVAL_SUMMARY ||
  resolve(root, "doc/progress/2026-08-28-w3-eval-summary.json");
mkdirSync(dirname(outJsonl), { recursive: true });

const agendas = protocol.agendas;
const rehearsalMemo = {
  consensus: ["W3 리허설: 반대 논거를 표에 남겼다"],
  open_issues: [
    {
      issue: "회수 기간",
      positions: { cfo: "12개월 내 불확실", mkt: "유입 우선", md: "부하 한도" },
    },
  ],
  missing_data: ["채널별 획득비용"],
  options: [{ option: "현상 유지 후 재측정", supported_by: ["cfo"] }],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function msUntilNextUtcHour() {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours() + 1,
    0,
    8,
    0,
  );
  return Math.max(8_000, next - now.getTime());
}

async function fetchJson(url, init) {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(90_000),
    });
    const body = await res.json().catch(() => ({}));
    return { res, body };
  } catch (err) {
    const timedOut =
      err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      res: { ok: false, status: timedOut ? 0 : 599 },
      body: { error: timedOut ? "timeout_90s" : String(err?.message || err) },
    };
  }
}

const health = await fetch(`${appUrl}/api/health`).then((r) => r.json());
if (!health.anthropic || !health.openai || !health.google || !health.supabase) {
  console.error("health not ready", health);
  process.exit(2);
}

const rows = [];
const done = new Set();
if (existsSync(outJsonl)) {
  for (const line of readFileSync(outJsonl, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (row.waitMs) continue;
    rows.push(row);
    if (row.label && row.run) done.add(`${row.label}:${row.run}`);
  }
  console.error(JSON.stringify({ resumeFrom: done.size }));
}
let consecutiveTotalFail = 0;
let rehearsalDone = rows.filter((r) => typeof r.memoMs === "number" && r.memoMs > 0)
  .length;
let stopReason = null;

async function createSession(item) {
  for (;;) {
    const { res, body } = await fetchJson(`${appUrl}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agenda: item.agenda, category: item.category }),
    });
    if (res.status === 429) {
      if (body.error === "daily_cap") {
        stopReason = `daily_cap:${body.message || "today"}`;
        return null;
      }
      const wait = msUntilNextUtcHour();
      console.error(
        JSON.stringify({
          waitMs: wait,
          until: new Date(Date.now() + wait).toISOString(),
          reason: body.error || "rate_limited",
        }),
      );
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      return { error: body.error || res.status };
    }
    return body;
  }
}

function cellSummary(turns) {
  const list = turns || [];
  return list.map((t) => ({
    persona: t.persona,
    status: t.status,
    error: t.error || null,
    objection: t.payload?.objection || "",
    changed: t.payload?.changed || "",
    position: t.payload?.position || "",
    latencyMs: t.latencyMs ?? t.latency_ms ?? null,
  }));
}

function collapseFlag(cells) {
  const ok = cells.filter((c) => c.status === "ok" && c.position);
  if (ok.length < 3) return false;
  const norms = ok.map((c) => c.position.replace(/\s+/g, "").slice(0, 40));
  return new Set(norms).size === 1;
}

for (const item of agendas) {
  if (stopReason) break;
  for (let i = 0; i < runs; i++) {
    if (stopReason) break;
    if (done.has(`${item.label}:${i + 1}`)) continue;
    const session = await createSession(item);
    if (session === null) break;
    if (session.error) {
      const row = {
        agenda: item.agenda,
        label: item.label,
        run: i + 1,
        error: session.error,
      };
      rows.push(row);
      done.add(`${item.label}:${i + 1}`);
      appendFileSync(outJsonl, `${JSON.stringify(row)}\n`);
      console.log(JSON.stringify(row));
      continue;
    }

    const t0 = Date.now();
    const r1Res = await fetchJson(`${appUrl}/api/round`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, round: 1 }),
    });
    const r1Ms = Date.now() - t0;
    const r1Cells = cellSummary(r1Res.body.turns);
    const ok1 = r1Cells.filter((t) => t.status === "ok").length;
    const failed1 = r1Cells.filter((t) => t.status !== "ok");

    let r2Ms = null;
    let r2Cells = [];
    let r2Error = null;
    let objectionOk = null;
    if (r1Res.res.ok) {
      const t1 = Date.now();
      const r2Res = await fetchJson(`${appUrl}/api/round`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, round: 2 }),
      });
      r2Ms = Date.now() - t1;
      if (r2Res.res.ok) {
        r2Cells = cellSummary(r2Res.body.turns);
        const ok2 = r2Cells.filter((t) => t.status === "ok");
        objectionOk =
          ok2.length > 0 &&
          ok2.every((t) => typeof t.objection === "string" && t.objection.trim());
      } else {
        r2Error = r2Res.body.error || r2Res.res.status;
        objectionOk = r2Error === "round1_insufficient" ? false : r2Error;
      }
    } else {
      r2Error = r1Res.body.error || r1Res.res.status;
    }

    let memoMs = null;
    if (rehearsalDone < 3 && ok1 >= 2 && r2Error == null) {
      const tm = Date.now();
      const memoRes = await fetchJson(`${appUrl}/api/memo`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, memo: rehearsalMemo }),
      });
      memoMs = Date.now() - tm;
      if (memoRes.res.ok) rehearsalDone += 1;
      else memoMs = -memoRes.res.status;
    }

    if (ok1 === 0) consecutiveTotalFail += 1;
    else consecutiveTotalFail = 0;
    if (consecutiveTotalFail >= 3) {
      stopReason = "three_consecutive_all_cell_failures";
    }

    const failed2 = r2Cells.filter((t) => t.status !== "ok");
    const row = {
      agenda: item.agenda,
      label: item.label,
      run: i + 1,
      sessionId: session.id,
      ok1,
      failed1: failed1.map((t) => `${t.persona}:${t.error || "failed"}`),
      r1Ms,
      r1Within30s: r1Ms <= 30_000,
      r2Ms,
      r2Error,
      ok2: r2Cells.filter((t) => t.status === "ok").length,
      failed2: failed2.map((t) => `${t.persona}:${t.error || "failed"}`),
      objectionOk,
      collapse: collapseFlag(r1Cells),
      positions: r1Cells.map((t) => `${t.persona}:${t.position.slice(0, 48)}`),
      memoMs,
    };
    rows.push(row);
    done.add(`${item.label}:${i + 1}`);
    appendFileSync(outJsonl, `${JSON.stringify(row)}\n`);
    console.log(JSON.stringify(row));
  }
}

const r2Attempted = rows.filter((r) => r.ok2 !== undefined);
const r2OkCells = r2Attempted.reduce((n, r) => n + (r.ok2 || 0), 0);
const r2FailedCells = r2Attempted.reduce(
  (n, r) => n + (r.failed2?.length || 0),
  0,
);
const objectionRows = rows.filter((r) => r.objectionOk === true).length;
const collapseCount = rows.filter((r) => r.collapse).length;
const summary = {
  appUrl,
  runs,
  protocolRuns: protocol.runsPerAgenda,
  sessionCount: rows.filter((r) => r.sessionId).length,
  stopReason,
  rehearsalMemos: rehearsalDone,
  objectionOkSessions: objectionRows,
  collapseSessions: collapseCount,
  r2OkCells,
  r2FailedCells,
  r1Within30s: rows.filter((r) => r.r1Within30s).length,
  rows,
};
writeFileSync(outSummary, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, rows: undefined, rowCount: rows.length }, null, 2));
if (stopReason) process.exit(3);
