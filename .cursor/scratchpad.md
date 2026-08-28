# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원. reasoningEffort는 `none`만 허용.
Gemini 크레딧 결제 후 md 셀은 프로덕션에서 성공. Haiku·nano JSON이 아직 깨져 F3 2성공은 미충족.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`
Gemini 실측: `doc/progress/2026-08-28-gemini-credit-check.md`

## Project Status Board

- [x] W1-4 Supabase `boardroom` / `tbtjdfayqgcdywybczjr` + 마이그레이션
- [x] Vercel LLM 3키 + DB (값은 문서에 없음). `/api/health` 4 true
- [x] Gemini 크레딧: HTTPS 세션 `LNIDoe` md ok (1236ms). 크레딧 에러 없음
- [ ] HTTPS 실토론 F3–F6 (cfo/mkt JSON 수정 후 재시도)

## Executor's Feedback or Assistance Requests

세션 `LNIDoe` R1 22966ms. md(gemini-3.1-flash-lite) ok. cfo/mkt JSON 파싱 실패로 ok=1, R2 스킵. Gemini 결제는 사용자 추가 작업 없음.

## Lessons

Supabase MCP는 service role 키를 반환하지 않는다. URL만 자동화 가능.
MVP는 RLS off가 PRD. anon을 NEXT_PUBLIC에 넣지 않는다.
gpt-5.4-nano는 responses 추론 모델. temperature 넣으면 경고만 나고, maxOutputTokens 400이 추론에 쓰여 JSON이 잘린다. reasoningEffort는 `none`만 허용(`minimal`은 거부).
Output.object가 22초 abort를 다 쓰면 텍스트 JSON 재시도가 없다. structuredAbortMs로 8초를 남긴다.
Gemini 크레딧 부족 시 셀은 발언 불가. 코드로 우회하지 않음. 결제 후 같은 키로 md가 1.2초에 성공함.
