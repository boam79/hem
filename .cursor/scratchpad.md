# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`
PRD AC 감사: `doc/progress/2026-08-28-prd-final-audit.md`

2026-08-29: 파일 관리 `/files` 전용. 대시보드에서 비용 패널 제거. 대기 말풍선은 테이블 중앙 1개. 완료는 Planner가 표시한다.

## Key Challenges and Analysis

`qr-asset-manager` pause 후 `boardroom` DB 생성됨. 실토론은 service role + 3사 키.
경량 모델 유지: haiku / gpt-5.4-nano / flash-lite. nano는 reasoning 모델이라 temperature 미지원. reasoningEffort는 `none`만 허용.
Gemini 크레딧 결제 후 md 셀은 프로덕션에서 성공. Haiku·nano JSON 복구 커밋 `32168f5` 후 세션 `4fyIcc` R1 okCount=3. 사용자 수동 확인 대기(지우지 않음). R2 수정 커밋 `7eda3e3` 후 세션 `uE7m2G` R1 ok=3, R2 ok=3.
2026-08-28 AC 감사: F1–F6·W1–W4 코드+테스트+HTTPS. **W3 5×10은 `/goal` 재개 후 50/50** (objection 50/50, 셀 실패 0). keepalive Vercel Cron 성공. GH Actions 시크릿은 사용자 몫.

## High-level Task Breakdown

모바일 이어서: `doc/progress/2026-08-28-mobile-handoff.md`
Gemini 실측: `doc/progress/2026-08-28-gemini-credit-check.md`
JSON 실측: `doc/progress/2026-08-28-haiku-nano-json.md`
R2 실측: `doc/progress/2026-08-28-round2-json.md`
AC 감사: `doc/progress/2026-08-28-ac-audit.md`
Haiku R2 빈 objection: `doc/progress/2026-08-28-haiku-r2-empty-objection.md`
현재(Executor): 엑셀·CSV 지표 업로드 완료. 더미 HTTPS 세션 `dohUks` R1·R2 ok=3.
2026-08-29 홈 02 UI: `doc/progress/2026-08-29-forest-ui-02.md`. HTTPS E2E 15. 배포 https://boardroom-six-delta.vercel.app

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
- [x] W3 안건 5종×10회 — **50/50**. objection 50/50, 셀 실패 0, R1 전부 ≤30s. 표 `doc/progress/2026-08-28-w3-close.md`
- [x] 엑셀·CSV 지표 업로드 — 더미 재무흐름·환자통계. HTTPS `dohUks` R1·R2 ok=3
- [x] keepalive 주 2회 — 스케줄 `0 3 * * 1,4`. HTTPS POST 12:12:22Z, Vercel Cron 12:16:07Z. GH Actions 시크릿은 사용자 몫.
- [x] 제한 429 HTTPS — 세션 POST만, 라운드 없음. `rate_limited` 429 (이번 턴 재확인).
- [x] 홈 UI를 `doc/design/02.png`와 같게 (민트 셸 + 회의실 + 업로드 종이더미·스파클). HTTPS E2E 15. 배포 https://boardroom-six-delta.vercel.app
- [ ] 테이블 중앙 종이더미 위치 + 페르소나 말풍선/이름표 제거. HTTPS 사용자 확인 대기.

## Executor's Feedback or Assistance Requests

세션 `LNIDoe` R1 22966ms. md ok. cfo/mkt JSON 실패로 ok=1. POST R2 → 422 (E2E).
Executor 실측 세션 `4fyIcc` R1 10067ms okCount=3. R2는 cfo JSON·mkt objection 빈값으로 ok=1.
Executor 실측 세션 `uE7m2G` R1 9709ms ok=3. R2 10963ms ok=3. 메모 PUT 200.
이번 eval(5×1): `yl91gj` `ZxiwXC` `MJg8Zz` `6FWsGv` `PGzDOA`. R1 전부 ok=3·30초 이내. R2는 `MJg8Zz`만 ok=3, 나머지 4건은 cfo(Haiku) 빈 objection으로 failed. `yl91gj` 메모 PUT 200.
Haiku R2 재시도 수정 후(`ba66843`): `cA_9I2` `4e4XEM` `NQSmdi` — 세 세션 R1 ok=3·30초 이내, R2 ok=3(cfo 포함). 문서 `doc/progress/2026-08-28-haiku-r2-empty-objection.md`.
사용자가 `/goal`로 5×10을 재개함. 인력·가격·해외 30회 HTTPS 완료 → **50/50**. 집계: objection 50/50, R2 실패 셀 0, collapse 0, 리허설 메모 3. 샘플 `/s/3lySX3` `/s/CASf5k` `/s/z3sYGk`.
최종 감사: `doc/progress/2026-08-28-prd-final-audit.md`. 제품 AC + W3 실행 증명. GH Actions 시크릿은 사용자 몫.

2026-08-29 Forest UI: `app/page.tsx`가 `ForestShell` + `MeetingScene` + `PaperStack`을 연결. 기존 POST `/api/metrics/parse` · `/api/session` · `/api/round` 유지. E2E 셀렉터(`#agenda`, `#metrics-file`, `토론 시작`, 디스클레이머, CSV/엑셀 더미 링크, 안건 10–200자) 로컬에서 확인. 커밋·푸시·배포는 하지 않음. HTTPS 스모크는 배포 후.

2026-08-29 메뉴·한눈: `/dashboard` health+최근세션, `/decision` 메모, `/settings` 읽기전용 페르소나. 홈 토론은 `DebateGlance`. 공유 `/s/[id]`는 기존 그리드. 실토론 버튼은 E2E에서 누르지 않음. HTTPS E2E 18.

2026-08-29 사용량·페르소나·스트리밍: `/api/usage` 월 집계+예산 잔여, `persona_overrides`로 이름·역할·습관·temperature 편집(프로바이더 고정), 홈은 `/api/round/stream` SSE. 계정 잔액 API는 키만으로 불가 → 콘솔 링크. 실토론 버튼은 E2E에서 누르지 않음. HTTPS E2E 21. 배포 https://boardroom-six-delta.vercel.app

2026-08-29 말풍선·토론결과: 홈에서 glance 카드·compact 제거. 업로드 패널을 회의실 왼쪽으로. `/debate` 메뉴. 단위 81·빌드 통과. HTTPS E2E 24. 실토론 `H_8AhS` 말풍선 3입장.

2026-08-29 파일관리·대기문구: `/files` 전용, 대시보드 CostPanel 제거, 테이블 중앙 `자료를 올려 주세요.` 1개. 단위 84. HTTPS E2E 26. 이름표는 캐릭터 몸통 쪽으로 재배치.

2026-08-29 말풍선: 납작한 CSS 박스가 점토 회의실과 안 맞음. 점토 말풍선 에셋으로 교체 중.

2026-08-29 종이더미: 위치 61.5%는 사용자 확인(아주 좋다). 짤림은 `.clay-stack overflow` + 이미지 235% 크롭. 바닥은 그대로 두고 PNG 전체를 상자에 맞춤. 사용자 하드 리프레시 후 확인 요청.

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
홈 `#metrics-file`은 Playwright `toBeVisible()`이 필요해서 `display:none`/`visibility:hidden`/`sr-only`를 쓰지 않는다. 드롭존 위 `opacity: 0.02` 오버레이로 크기를 유지한다.
heading `대시보드`는 `비용 대시보드`와도 매칭된다. Playwright는 `exact: true`가 필요하다.
홈에서 토론이 시작되면 결과 카드 때문에 회의실을 compact로 접고 `.speech-bubble { display: none }`을 켜면 02 시안의 말풍선이 사라진다. 카드는 `/debate`로 빼고 회의실은 접지 않는다.
아이소메트릭 테이블에서 CSS `top`을 키우면 화면 아래 = 테이블 앞. 종이더미는 `translate(-50%, -100%)`로 박스 바닥을 테이블에 붙인다. 여우 앞(`top` 54%)은 뒤쪽, 바인더 삼각형(72%)은 앞쪽. 세 캐릭터 사이 빈 나무면은 바닥 약 61.5%. `.paper-pile-wrap { overflow: hidden }`는 그림자를 네모로 잘라 이질적으로 보인다. 크롭은 `.clay-stack`에만 둔다. PNG 네온 초록은 약한 sepia로 민트회색이 되므로 `sepia(1)`로 나무색에 붙인다.
짧은 더미를 만들려 `height: 235%` + `overflow: hidden`으로 PNG 아래만 확대하면 윗장이 가로로 잘린다. 위치는 `translate(-50%, -100%)`로 바닥을 고정하고, 이미지 전체를 `object-fit: contain`으로 상자에 담는다.
