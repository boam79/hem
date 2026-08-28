# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`
PRD AC 감사: `doc/progress/2026-08-28-ac-audit.md`

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원. reasoningEffort는 `none`만 허용.
Gemini 크레딧 결제 후 md 셀은 프로덕션에서 성공. Haiku·nano JSON 복구 커밋 `32168f5` 후 세션 `4fyIcc` R1 okCount=3. 사용자 수동 확인 대기(지우지 않음). R2 수정 커밋 `7eda3e3` 후 세션 `uE7m2G` R1 ok=3, R2 ok=3.
2026-08-28 AC 감사: F1–F3·F5–F6·W4는 코드+테스트+HTTPS 증거가 있음. F4는 성공 셀 objection·422는 있으나 Haiku R2 빈 objection으로 셀 실패가 5안건 중 4건. W3는 5×1만(5×10 아님). keepalive 주 2회 성공 로그는 미확인.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`
Gemini 실측: `doc/progress/2026-08-28-gemini-credit-check.md`
JSON 실측: `doc/progress/2026-08-28-haiku-nano-json.md`
R2 실측: `doc/progress/2026-08-28-round2-json.md`
AC 감사: `doc/progress/2026-08-28-ac-audit.md`
Haiku R2 빈 objection: `doc/progress/2026-08-28-haiku-r2-empty-objection.md`
현재(Executor): Haiku R2 빈 objection — 커밋 `ba66843` 배포 READY. HTTPS 3세션 R2 ok=3. 사용자 확인 대기. 완료 단정 금지. W3 keepalive는 손대지 않음.

## Project Status Board

- [x] P0 Cloud·git·푸시
- [x] W1-1~2 앱·스키마
- [x] W1-3 경량 ID: haiku / gpt-5.4-nano / flash-lite
- [x] W1-4 Supabase `boardroom` / `tbtjdfayqgcdywybczjr` + 마이그레이션
- [x] Vercel LLM 3키 + DB (값은 문서에 없음). `/api/health` 4 true
- [x] Gemini 크레딧: HTTPS 세션 `LNIDoe` md ok (1236ms). 크레딧 에러 없음
- [ ] Haiku·nano JSON 복구 — Executor HTTPS 세션 `4fyIcc` R1 ok=3. 사용자 수동 확인 대기
- [ ] Haiku R2 빈 objection — Executor 실측 3세션 R2 ok=3(`cA_9I2` `4e4XEM` `NQSmdi`). 사용자 확인 대기. 경량 3사 유지.
- [ ] HTTPS 실토론 F3–F6 (R1·R2 Executor 실측됨, 사용자 확인 남음)
- [x] AC 감사 단위 테스트·E2E 11 (프로덕션 HTTPS, localhost 아님)
- [ ] W3 안건 5종×10회 — 이번 턴은 5×1만. Haiku R2는 재수정 후 3세션 ok=3. 5×10은 범위 밖.
- [ ] keepalive 주 2회 성공 로그 — 워크플로 파일+401은 있음. gh 미인증으로 실행 로그 미확인

## Executor's Feedback or Assistance Requests

세션 `LNIDoe` R1 22966ms. md ok. cfo/mkt JSON 실패로 ok=1. POST R2 → 422 (E2E).
Executor 실측 세션 `4fyIcc` R1 10067ms okCount=3. R2는 cfo JSON·mkt objection 빈값으로 ok=1.
Executor 실측 세션 `uE7m2G` R1 9709ms ok=3. R2 10963ms ok=3. 메모 PUT 200.
이번 eval(5×1): `yl91gj` `ZxiwXC` `MJg8Zz` `6FWsGv` `PGzDOA`. R1 전부 ok=3·30초 이내. R2는 `MJg8Zz`만 ok=3, 나머지 4건은 cfo(Haiku) 빈 objection으로 failed. `yl91gj` 메모 PUT 200.
Haiku R2 재시도 수정 후(`ba66843`): `cA_9I2` `4e4XEM` `NQSmdi` — 세 세션 R1 ok=3·30초 이내, R2 ok=3(cfo 포함). 문서 `doc/progress/2026-08-28-haiku-r2-empty-objection.md`.
완료라고 단정하지 않음. Planner/사용자 확인 요청:
1. https://boardroom-six-delta.vercel.app/s/cA_9I2 — 리스 안건 R2 세 칸 반대
2. https://boardroom-six-delta.vercel.app/s/4e4XEM — 검색광고 R2 세 칸 반대
3. https://boardroom-six-delta.vercel.app/s/NQSmdi — ICL 가격 R2 세 칸 반대
4. https://boardroom-six-delta.vercel.app/s/uE7m2G — 이전 R2 성공 세션(지우지 않음)
5. https://boardroom-six-delta.vercel.app/s/w4demo · /demo/slide — 데모(실호출 아님)

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
프로덕션 E2E에서 유효 안건으로 “토론 시작”을 누르면 실 LLM이 돈다. DB 미연결을 가정한 클릭 테스트는 HTTPS에서 쓰지 않는다.
Haiku R2 빈 objection은 전각 콜론 수정 후에도 재발한다(5안건 중 4, 에러 `round2 requires non-empty objection and changed`). 성공 셀 F4와 별개로 셀 실패율이 높다.
R2 첫 호출에 objection-first 최소 예시가 없으면 Haiku가 빈 문자열을 낸다. jsonrepair는 빈 값을 성공으로 만들지 않는다. 빈 필드 전용 재시도 문구가 필요하다.
