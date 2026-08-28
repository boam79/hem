# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`

## Project Status Board

- [x] W1-4 Supabase `boardroom` / `tbtjdfayqgcdywybczjr` + 마이그레이션
- [ ] Vercel `SUPABASE_SERVICE_ROLE_KEY` + LLM 3키
- [ ] HTTPS 실토론 F3–F6

## Executor's Feedback or Assistance Requests

노트북 종료. Cloud Agent는 handoff 문서를 따른다.

## Lessons

Supabase MCP는 service role 키를 반환하지 않는다. URL만 자동화 가능.
MVP는 RLS off가 PRD. anon을 NEXT_PUBLIC에 넣지 않는다.
