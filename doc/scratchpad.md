# Boardroom (hem) — Scratchpad

원본 위치: `doc/scratchpad.md`. `.cursor/scratchpad.md`는 동일 내용을 유지한다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. GitHub: https://github.com/boam79/hem

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원. reasoningEffort는 `none`만 허용.
Gemini 크레딧 결제 후 md 셀은 프로덕션에서 성공. Haiku·nano JSON 복구 커밋 `32168f5` 후 세션 `4fyIcc` R1 okCount=3. 사용자 수동 확인 전. R2는 아직 깨짐.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`
Gemini 실측: `doc/progress/2026-08-28-gemini-credit-check.md`
현재(Executor): Haiku·nano JSON 복구 실측 기록. 사용자에게 세션 `4fyIcc` R1 수동 확인 요청.
JSON 실측: `doc/progress/2026-08-28-haiku-nano-json.md`

## Project Status Board

- [x] P0 Cloud·git·푸시
- [x] W1-1~2 앱·스키마
- [x] W1-3 경량 ID: haiku / gpt-5.4-nano / flash-lite
- [x] Vercel Production 키 연결됨 (`/api/health` 4 true). 값은 문서에 적지 않음.
- [x] Gemini 크레딧: HTTPS 세션 `LNIDoe` md ok (1236ms). 크레딧 에러 없음
- [ ] Haiku·nano JSON 복구 — Executor HTTPS 세션 `4fyIcc` R1 ok=3. 사용자 수동 확인 대기
- [ ] HTTPS 실토론 F3–F6 (R1은 실측됨, R2·사용자 확인 남음)

## Executor's Feedback or Assistance Requests

세션 `LNIDoe` R1 22966ms. md ok. cfo/mkt JSON 실패로 ok=1.
Executor 실측 세션 `4fyIcc` R1 10067ms okCount=3 (cfo 5824 / mkt 6386 / md 1309). R2는 cfo JSON·mkt objection 빈값으로 ok=1.
완료라고 단정하지 않음. Planner/사용자: https://boardroom-six-delta.vercel.app/s/4fyIcc 에서 라운드 1 세 칸이 발언을 보여 주는지 확인해 주세요.

## Lessons

MCP `get_publishable_keys`는 anon만 준다. service_role은 대시보드. RLS off는 PRD MVP.
gpt-5.4-nano는 responses 추론 모델. temperature 넣으면 경고만 나고, maxOutputTokens 400이 추론에 쓰여 JSON이 잘린다. reasoningEffort는 `none`만 허용(`minimal`은 거부).
Output.object가 22초 abort를 다 쓰면 텍스트 JSON 재시도가 없다. structuredAbortMs로 8초를 남긴다.
Gemini 크레딧 부족 시 셀은 발언 불가. 코드로 우회하지 않음. 결제 후 같은 키로 md가 1.2초에 성공함.
닫는 `}`가 없는 잘린 JSON은 lastIndexOf("}")가 실패한다. jsonrepair는 따옴표·쉼표·줄바꿈·절단을 한 번에 고친다.
OpenAI structured output에는 `.optional()`과 min/max를 빼고 모든 키를 required로 둔 뒤, 파싱 후 길이를 클립한다.
