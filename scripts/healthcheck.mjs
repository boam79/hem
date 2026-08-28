#!/usr/bin/env node
/**
 * Demo-hour health check against the deployed HTTPS app.
 * Usage: APP_URL=https://boardroom-six-delta.vercel.app node scripts/healthcheck.mjs
 */
const appUrl = process.env.APP_URL || "https://boardroom-six-delta.vercel.app";

if (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(appUrl)) {
  console.error("APP_URL must be deployed HTTPS");
  process.exit(1);
}

const res = await fetch(`${appUrl.replace(/\/$/, "")}/api/health`);
if (!res.ok) {
  console.error("health http", res.status);
  process.exit(1);
}
const body = await res.json();
console.log(JSON.stringify({ appUrl, ...body }, null, 2));
const ready = body.anthropic && body.openai && body.google && body.supabase;
process.exit(ready ? 0 : 2);
