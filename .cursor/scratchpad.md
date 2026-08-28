# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원, 400토큰이 생각에 쓰이면 JSON이 잘린다. OpenAI는 reasoningEffort minimal, 구조화 실패 시 error.text에서 JSON 복구.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`

## Project Status Board

- [x] W1-4 Supabase `boardroom` / `tbtjdfayqgcdywybczjr` + 마이그레이션
- [x] Vercel LLM 3키 + DB (값은 문서에 없음). `/api/health` 4 true
- [ ] HTTPS 실토론 F3–F6 (nano JSON/reasoning 수정 배포 후 재시도)

## Executor's Feedback or Assistance Requests

HTTPS 라운드1(P2qYqy) 29883ms. 3셀 실패: haiku JSON 없음, nano JSON 깨짐(추론 토큰), Gemini 크레딧. 코드 우회 없음. reasoningEffort·JSON 복구 푸시 후 재시도.

## Lessons

Supabase MCP는 service role 키를 반환하지 않는다. URL만 자동화 가능.
MVP는 RLS off가 PRD. anon을 NEXT_PUBLIC에 넣지 않는다.
gpt-5.4-nano는 responses 추론 모델. temperature 넣으면 경고만 나고, maxOutputTokens 400이 추론에 쓰여 JSON이 잘린다. reasoningEffort는 `none`만 허용(`minimal`은 거부).
Output.object가 22초 abort를 다 쓰면 텍스트 JSON 재시도가 없다. structuredAbortMs로 8초를 남긴다.
