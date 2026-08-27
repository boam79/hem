# 2026-08-28 Cloud clone + install evidence

Cursor Cloud cloned `https://github.com/boam79/hem` (`main`) and ran the Cloud install script as a successful no-op because `package.json` is absent.

- hostname: `cursor`
- uname -a: `Linux cursor 6.12.94+ #1 SMP PREEMPT_DYNAMIC Thu Aug 27 17:56:59 UTC 2026 x86_64 GNU/Linux`
- git SHA: `8134cb5122d96d22c86e29a0df0aa16695374ccc` (`8134cb5`)
- install command: `if [ -f package.json ]; then corepack enable && pnpm install --frozen-lockfile=false; fi`
- install exit code: `0`

Confirmed present: `AGENTS.md`, `.cursor/environment.json`, `doc/README.md`, `doc/prd/PRD_v1.0.md`.
Confirmed absent: `package.json`.
