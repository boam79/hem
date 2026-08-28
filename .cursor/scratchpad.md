# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`
PRD AC 감사: `doc/progress/2026-08-28-prd-final-audit.md`

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원. reasoningEffort는 `none`만 허용.
Gemini 크레딧 결제 후 md 셀은 프로덕션에서 성공. Haiku·nano JSON 복구 커밋 `32168f5` 후 세션 `4fyIcc` R1 okCount=3. 사용자 수동 확인 대기(지우지 않음). R2 수정 커밋 `7eda3e3` 후 세션 `uE7m2G` R1 ok=3, R2 ok=3.
2026-08-28 AC 감사: F1–F3·F5–F6·W4는 코드+테스트+HTTPS 증거가 있음. F4는 `ba66843` 후 3세션 R2 ok=3. W3 keepalive HTTPS+Cron pinged_at 있음. **W3 5×10은 사용자가 20/50에서 중단(축소 아님, 완료 아님).** 제한 429는 HTTPS 세션 POST만으로 실측.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`
Gemini 실측: `doc/progress/2026-08-28-gemini-credit-check.md`
JSON 실측: `doc/progress/2026-08-28-haiku-nano-json.md`
R2 실측: `doc/progress/2026-08-28-round2-json.md`
AC 감사: `doc/progress/2026-08-28-ac-audit.md`
Haiku R2 빈 objection: `doc/progress/2026-08-28-haiku-r2-empty-objection.md`
현재(Executor): PRD 문장 단위 감사 `doc/progress/2026-08-28-prd-final-audit.md`. 제품 AC는 HTTPS+코드로 증명. **5×10 실행은 사용자 중단(완료 아님).** eval 재시작 안 함.

## Project Status Board

- [x] P0 Cloud·git·푸시
- [x] W1-1~2 앱·스키마
- [x] W1-3 경량 ID: haiku / gpt-5.4-nano / flash-lite
- [x] W1-4 Supabase `boardroom` / `tbtjdfayqgcdywybczjr` + 마이그레이션
- [x] Vercel LLM 3키 + DB (값은 문서에 없음). `/api/health` 4 true
- [x] Gemini 크레딧: HTTPS 세션 `LNIDoe` md ok (1236ms). 크레딧 에러 없음
- [x] Haiku·nano JSON 복구 — HTTPS R1 ok=3 (`4fyIcc` 및 이후 세션)
- [x] Haiku R2 빈 objection — 3세션 R2 ok=3(`cA_9I2` `4e4XEM` `NQSmdi`). GET+페이지 E2E
- [x] HTTPS 실토론 F3–F6 — 위 세션 + `uE7m2G` 메모. Playwright 12
- [x] AC 감사 단위 47 · E2E 12 (프로덕션 HTTPS, localhost 아님)
- [ ] W3 안건 5종×10회 — **사용자 중단**. 축소 아님, 완료 아님. 증거: `cA_9I2` `4e4XEM` `NQSmdi` + 투자·마케팅 20/50. 인력·가격·해외 안 함. eval 프로세스 종료.
- [x] keepalive 주 2회 — 스케줄 `0 3 * * 1,4`. HTTPS POST 12:12:22Z, Vercel Cron 12:16:07Z. GH Actions 시크릿은 사용자 몫.
- [x] 제한 429 HTTPS — 세션 POST만, 라운드 없음. `rate_limited` 429 (이번 턴 재확인).

## Executor's Feedback or Assistance Requests

세션 `LNIDoe` R1 22966ms. md ok. cfo/mkt JSON 실패로 ok=1. POST R2 → 422 (E2E).
Executor 실측 세션 `4fyIcc` R1 10067ms okCount=3. R2는 cfo JSON·mkt objection 빈값으로 ok=1.
Executor 실측 세션 `uE7m2G` R1 9709ms ok=3. R2 10963ms ok=3. 메모 PUT 200.
이번 eval(5×1): `yl91gj` `ZxiwXC` `MJg8Zz` `6FWsGv` `PGzDOA`. R1 전부 ok=3·30초 이내. R2는 `MJg8Zz`만 ok=3, 나머지 4건은 cfo(Haiku) 빈 objection으로 failed. `yl91gj` 메모 PUT 200.
Haiku R2 재시도 수정 후(`ba66843`): `cA_9I2` `4e4XEM` `NQSmdi` — 세 세션 R1 ok=3·30초 이내, R2 ok=3(cfo 포함). 문서 `doc/progress/2026-08-28-haiku-r2-empty-objection.md`.
W3 keepalive: HTTPS POST 200 `2026-08-28T12:12:22.673Z`, Cron `2026-08-28T12:16:07.567Z`. eval 20/50은 `doc/progress/2026-08-28-w3-close.md`. **사용자는 남은 30회를 중단함.** 제한 429 HTTPS: 세션 POST → 429 `rate_limited` (라운드 없음, 이번 감사 턴 재확인).
최종 감사: `doc/progress/2026-08-28-prd-final-audit.md`. 제품 AC 증명. 5×10 실행은 사용자 중단. 셀 배지+GET E2E만 보강.
URL: `/s/cA_9I2` `/s/4e4XEM` `/s/NQSmdi` `/s/uE7m2G` `/s/w4demo` `/demo/slide`

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
IP 시간당 10은 50회 eval을 시각마다 10건+대기로 만든다. 프로세스 sleep은 hang이 아니다. jsonl resume과 fetch 90초 타임아웃을 둔다.
