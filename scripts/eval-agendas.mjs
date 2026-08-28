#!/usr/bin/env node
/**
 * W3 eval runner. HTTPS only. Requires /api/health all true.
 * Usage: APP_URL=https://boardroom-six-delta.vercel.app node scripts/eval-agendas.mjs
 * Default RUNS=1 to stay under IP 10/hour. Full protocol is RUNS=10 spread across hours.
 */
const appUrl = (process.env.APP_URL || "https://boardroom-six-delta.vercel.app").replace(
  /\/$/,
  "",
);
const runs = Number(process.env.RUNS || 1);

if (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(appUrl)) {
  console.error("APP_URL must be deployed HTTPS");
  process.exit(1);
}

const agendas = [
  { category: "investment", agenda: "스마일 전용 레이저 리스 계약 12개월" },
  { category: "marketing", agenda: "백내장 검색광고 예산 30% 증액" },
  { category: "staffing", agenda: "상담 간호사 1명 충원으로 설명 시간 확보" },
  { category: "pricing", agenda: "ICL 패키지 가격 8퍼센트 인하" },
  { category: "marketing", agenda: "중국 에이전시 수수료 구간 상향 검토" },
];

const health = await fetch(`${appUrl}/api/health`).then((r) => r.json());
if (!health.anthropic || !health.openai || !health.google || !health.supabase) {
  console.error("health not ready", health);
  process.exit(2);
}

const rows = [];
for (const item of agendas) {
  for (let i = 0; i < runs; i++) {
    const sessionRes = await fetch(`${appUrl}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(item),
    });
    const session = await sessionRes.json();
    if (!sessionRes.ok) {
      rows.push({ ...item, run: i + 1, error: session.error || sessionRes.status });
      continue;
    }
    const t0 = Date.now();
    const r1Res = await fetch(`${appUrl}/api/round`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, round: 1 }),
    });
    const r1Ms = Date.now() - t0;
    const r1 = await r1Res.json();
    const ok1 = (r1.turns || []).filter((t) => t.status === "ok").length;
    const failed = (r1.turns || []).filter((t) => t.status !== "ok").length;
    let objectionOk = null;
    if (r1Res.ok) {
      const r2Res = await fetch(`${appUrl}/api/round`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, round: 2 }),
      });
      const r2 = await r2Res.json();
      if (r2Res.ok) {
        const ok2 = (r2.turns || []).filter((t) => t.status === "ok");
        objectionOk = ok2.every((t) => t.payload?.objection);
      } else {
        objectionOk = r2.error === "round1_insufficient" ? false : r2.error;
      }
    }
    rows.push({
      agenda: item.agenda,
      run: i + 1,
      sessionId: session.id,
      ok1,
      failed,
      r1Ms,
      r1Within30s: r1Ms <= 30_000,
      objectionOk,
    });
    console.log(JSON.stringify(rows.at(-1)));
  }
}

console.log(JSON.stringify({ appUrl, runs, rows }, null, 2));
