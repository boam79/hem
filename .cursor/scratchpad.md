# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원. reasoningEffort는 `none`만 허용.
Gemini 크레딧 결제 후 md 셀은 프로덕션에서 성공. Haiku·nano JSON 복구 커밋 `32168f5` 후 세션 `4fyIcc` R1 okCount=3. 사용자 수동 확인 대기(지우지 않음). R2 수정 커밋 `7eda3e3` 후 세션 `uE7m2G` R1 ok=3, R2 ok=3.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`
Gemini 실측: `doc/progress/2026-08-28-gemini-credit-check.md`
JSON 실측: `doc/progress/2026-08-28-haiku-nano-json.md`
R2 실측: `doc/progress/2026-08-28-round2-json.md`
현재(Executor): 라운드 2 HTTPS 실측 기록. 사용자에게 세션 `uE7m2G` R2 수동 확인 요청.

## Project Status Board

- [x] W1-4 Supabase `boardroom` / `tbtjdfayqgcdywybczjr` + 마이그레이션
- [x] Vercel LLM 3키 + DB (값은 문서에 없음). `/api/health` 4 true
- [x] Gemini 크레딧: HTTPS 세션 `LNIDoe` md ok (1236ms). 크레딧 에러 없음
- [ ] Haiku·nano JSON 복구 — Executor HTTPS 세션 `4fyIcc` R1 ok=3. 사용자 수동 확인 대기
- [ ] 라운드 2 JSON/objection 수정 — Executor HTTPS 세션 `uE7m2G` R2 ok=3. 사용자 수동 확인 대기
- [ ] HTTPS 실토론 F3–F6 (R1·R2 Executor 실측됨, 사용자 확인 남음)

## Executor's Feedback or Assistance Requests

세션 `LNIDoe` R1 22966ms. md ok. cfo/mkt JSON 실패로 ok=1.
Executor 실측 세션 `4fyIcc` R1 10067ms okCount=3 (cfo 5824 / mkt 6386 / md 1309). R2는 cfo JSON·mkt objection 빈값으로 ok=1.
Executor 실측 세션 `uE7m2G` R1 9709ms ok=3 (cfo 5205 / mkt 3096 / md 1398). R2 10963ms ok=3 (cfo 7783 / mkt 4592 / md 1905). 메모 PUT 200.
완료라고 단정하지 않음. Planner/사용자: https://boardroom-six-delta.vercel.app/s/uE7m2G 에서 라운드 2 세 칸에 반대(objection)가 보이는지 확인해 주세요.

## Lessons

Supabase MCP는 service role 키를 반환하지 않는다. URL만 자동화 가능.
MVP는 RLS off가 PRD. anon을 NEXT_PUBLIC에 넣지 않는다.
gpt-5.4-nano는 responses 추론 모델. temperature 넣으면 경고만 나고, maxOutputTokens 400이 추론에 쓰여 JSON이 잘린다. reasoningEffort는 `none`만 허용(`minimal`은 거부).
Output.object가 22초 abort를 다 쓰면 텍스트 JSON 재시도가 없다. structuredAbortMs로 8초를 남긴다.
Gemini 크레딧 부족 시 셀은 발언 불가. 코드로 우회하지 않음. 결제 후 같은 키로 md가 1.2초에 성공함.
닫는 `}`가 없는 잘린 JSON은 lastIndexOf("}")가 실패한다. jsonrepair는 따옴표·쉼표·줄바꿈·절단을 한 번에 고친다.
OpenAI structured output에는 `.optional()`과 min/max를 빼고 모든 키를 required로 둔 뒤, 파싱 후 길이를 클립한다.
Haiku R2는 전각 콜론(`：`)이나 키 뒤 한국어 값에 `:`를 빼 jsonrepair가 `Colon expected`를 던진다. 전각→반각 치환 후 `"key" 한글` 사이에 `:`를 넣는다.
R2 JSON 재시도 예시에 objection/changed가 없으면 nano가 빈 문자열을 낸다. R2 전용 예시를 쓴다.
