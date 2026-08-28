# Boardroom (hem) — Scratchpad

원본 위치: `doc/scratchpad.md`. `.cursor/scratchpad.md`는 동일 내용을 유지한다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. GitHub: https://github.com/boam79/hem

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원, 400토큰이 생각에 쓰이면 JSON이 잘린다. OpenAI는 reasoningEffort minimal, 구조화 실패 시 error.text에서 JSON 복구.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`

## Project Status Board

- [x] P0 Cloud·git·푸시
- [x] W1-1~2 앱·스키마
- [x] W1-3 경량 ID: haiku / gpt-5.4-nano / flash-lite
- [x] Vercel Production 키 연결됨 (`/api/health` 4 true). 값은 문서에 적지 않음.
- [ ] HTTPS 실토론 F3–F6 (nano JSON/reasoning 수정 배포 후 재시도)

## Executor's Feedback or Assistance Requests

HTTPS 라운드1(P2qYqy) 29883ms. 3셀 실패: haiku JSON 없음, nano JSON 깨짐(추론 토큰), Gemini 크레딧. 코드 우회 없음. reasoningEffort·JSON 복구 푸시 후 재시도.

## Lessons

MCP `get_publishable_keys`는 anon만 준다. service_role은 대시보드. RLS off는 PRD MVP.
gpt-5.4-nano는 responses 추론 모델. temperature 넣으면 경고만 나고, maxOutputTokens 400이 추론에 쓰여 JSON이 잘린다. reasoningEffort는 `none`만 허용(`minimal`은 거부).
Output.object가 22초 abort를 다 쓰면 텍스트 JSON 재시도가 없다. structuredAbortMs로 8초를 남긴다.
