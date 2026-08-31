# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`
PRD AC 감사: `doc/progress/2026-08-28-prd-final-audit.md`

2026-08-29: 파일 관리 `/files` 전용. 대시보드에서 비용 패널 제거. 대기 말풍선은 테이블 중앙 1개. 완료는 Planner가 표시한다.

2026-08-30 Planner: 고도화 제안 P1 쟁점 모음(LLM 0) · P2 업로드 통계 확장 · P3 이상월 칩 · P4 심사 안건 채우기 · P5 공유 한 장. 상세 `doc/progress/2026-08-30-upgrade-proposals.md`. 구현은 패키지 1개 지정 후.

2026-08-31: 홈에 보이는 「토론 시작」이 없었다. 헤더만 「시뮬레이션 다음 턴」이고 누르면 바로 LLM이 돌았다. 안건 아래에 「토론 시작」을 두고, 시작 시 올린 데이터로 할지 그냥 진행할지 고른다.
2026-08-31: 상단 메뉴(토론 결과·대시보드·의사결정)와 하단 도크(회의록·지표 대시보드·시나리오 결과·AI 인사이트)가 이름·아이콘이 달랐다. 같은 네 칸으로 맞춘다. 설정은 헤더 버튼, 파일 관리는 상단에 남긴다.

## Key Challenges and Analysis

사이드바 6칸을 더 늘리면 02 셸이 답답해진다. 통계는 올린 직후 `/files`에 표를 붙이고, 안건 없는 회의는 홈 「데이터 검토」만 추가한다. 인사이트용 4번째 LLM은 두지 않는다. 「토론 시작」의 안건 10자 규칙은 유지한다. 데이터 검토는 고정 안건을 POST에만 넣는다. E2E는 「데이터 검토」와 선택 창의 「올린 데이터로 진행」「그냥 진행」을 누르지 않는다. 「토론 시작」클릭은 선택 창만 연다.
헤더 「시뮬레이션 다음 턴」과 왼쪽 「토론 시작」을 같은 accessible name으로 두면 boundingBox가 깨진다. 헤더는 `aria-label="시뮬레이션 다음 턴"`.
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
2026-08-30 Planner: 데이터 검토 회의 + 업로드 통계. 메뉴 추가 없음. `doc/progress/2026-08-30-data-review-stats-plan.md`.
1. 고정 안건 상수 + 통계 요약 함수 + 단위 테스트. 성공: 안건 10~200자, 더미 지표에서 12행·합계.
2. `/files`에 업로드 통계 표. 성공: 더미 CSV 후 병원명·월 열. LLM 없음.
3. 홈 「데이터 검토」. 업로드 없으면 disabled. 누르면 고정 안건으로 기존 세션·라운드. 성공: 단위 + E2E는 노출/disabled만. 클릭 금지.
4. HTTPS E2E 배포 후. 성공: 파일 관리 표, 홈 버튼. 「데이터 검토」실클릭 없음. 선택 창의 「올린 데이터로 진행」「그냥 진행」실클릭 없음.
2026-08-29 홈 02 UI: `doc/progress/2026-08-29-forest-ui-02.md`. HTTPS E2E 15. 배포 https://boardroom-six-delta.vercel.app
2026-08-31 Planner: 안건 아래 「토론 시작」+ 올린 데이터/그냥 진행 선택. `doc/progress/2026-08-31-debate-start-chooser.md`.
1. `debateStartBody` 단위 테스트. 성공: 올린 지표 포함/생략.
2. 홈 버튼·선택 창. 성공: 안건 아래 「토론 시작」, 파일 없으면 「올린 데이터로 진행」disabled, 취소로 닫힘. LLM 호출 없음.
3. HTTPS E2E 배포 후. 성공: 선택 창 노출. 「그냥 진행」「올린 데이터로 진행」실클릭 없음.

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
- [ ] 홈 UI를 `doc/design/03.png`와 같게 (왼쪽 카드 열 + 오른쪽 회의실, 사람 3명). 배포·HTTPS E2E 사용자 확인 대기.
- [ ] 테이블 중앙 종이더미 위치 + 페르소나 말풍선/이름표 제거. HTTPS 사용자 확인 대기.
- [ ] 바인더·타임라인 2026 + 토론 중 점토 말풍선 3개. HTTPS 사용자 확인 대기.
- [ ] 400KB 이내 전 진료과·성별·나이대·지역 환자 더미 업로드. 파서가 환자행을 월별 지표로 합침. HTTPS 사용자 확인 대기.
- [ ] 업로드 통계·데이터 검토. 메뉴 추가 없음. 단위 104 · HTTPS E2E 27. 배포 https://boardroom-six-delta.vercel.app 사용자 확인 대기(데이터 검토 실클릭은 비용).
- [ ] 토론 한글 순화. 지표 키·약어·배지. 단위 110. HTTPS 사용자 확인 대기.
- [ ] 고도화. 제안서 `doc/progress/2026-08-30-upgrade-proposals.md`. 패키지 미지정.
- [ ] 홈 「토론 시작」+ 올린 데이터/그냥 진행 선택. 사용자 확인 대기.
- [ ] 상단 메뉴와 하단 도크 네 칸 이름·경로 일치. 사용자 확인 대기.
- [ ] 하단 도크 삭제 · 테이블 서류 2026. HTTPS 사용자 확인 대기.

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

2026-08-30 종이더미: 나무 톤에 맞춤. 네온·노란 글로우 제거, 약한 웜 필터, 접촉 그림자. 위치 61.5%.

2026-08-30 어울림(Executor): PNG 발치 라임을 회색으로 죽이지 않고 지움. 아랫장 노란 바운스는 크림으로. 접촉은 나무색 AO. `sepia(0.1)`만. HTTPS 사용자 확인 대기.

2026-08-30 서류 매칭(Executor): 사용자가 3번=02 시안과 동일하게. 대기 타일과 토론 후 산이 서로 다른 물건. 같은 02 종이산(낮음/높음)으로 교체. 말풍선은 이전 요청대로 테이블에 없음.

2026-08-30 서류 재수정(Executor): 오버레이 PNG는 바인더와 조명·원근이 안 맞음. 대기=`forest-room-idle.png`, 업로드·토론=`forest-room-stacked.png`에 바인더 크기로 구워 넣음. 스티커 오버레이 제거.

2026-08-30 서류 재인페인트(Executor): bake1도 흰 아이소메트릭 PNG를 붙인 것이라 후광·스티커가 남음. 원본 `forest-room.png`에 점토 서류를 그려 넣음(캐릭터·바인더 유지). 대기=낮은 크림산, 업로드=높은 크림산+윗장만 민트 그리드. 흰 글로우 없음. HTTPS 사용자 확인 대기.

2026-08-30 연도·말풍선(Executor): 바인더·타임라인 2024→2026. 말풍선은 `shouldShowPersonaBubble`이 항상 false라 토론 중에도 안 나옴. 토론 시작·발언이 있으면 02색 점토 말풍선 3개(민트/주황/파랑, 꼬리는 각 캐릭터). 이름표는 그대로 없음. HTTPS 사용자 확인 대기.

2026-08-30 진료 말풍선 꼬리(Executor): 파란 말풍선 꼬리가 왼쪽(여우)을 가리킴. 이미지를 좌우 반전해 꼬리를 오른쪽 아래(고양이 진료원장)로.

2026-08-30 환자더미 업로드 오류(Executor): 프로덕션은 `month` 헤더만 받음. 방문행 CSV를 올리면 `month 헤더 행이 없습니다`. `hospital-patients-full.csv`를 월별 집계로 바꿈. 엑셀은 `monthly`+`patients`. 방문행은 `hospital-patients-visits.csv`. 단위 99. 사용자는 Finder에서 월별 CSV/엑셀을 다시 올리면 됨.

2026-08-30 데이터검토 전칸(Executor): `/files` 업로드 통계 표, 홈 「데이터 검토」(업로드 없으면 disabled, 고정 안건). 메뉴 그대로. 단위 104 · HTTPS E2E 27. 커밋 `cbf0b12` `2956532`. 실토론 버튼은 E2E에서 누르지 않음.

2026-08-30 토론한글(Executor): 지표 표·근거 예시를 한글. 화면은 `koreanizePublicText`로 저장된 영문 키도 순현금·검색광고 유입 등으로. 배지 앤트로픽·오픈AI·구글. 단위 110. 실토론 클릭 없음.

2026-08-30 Planner: 고도화 5패키지. 라운드 3·자동 합의·4번째 모델은 제외. 사용자가 P1–P5 중 고르면 칸 분해.
2026-08-31 Executor: 사용자가 시안 3번(`doc/design/03.png`)으로 홈을 바꿈. 민트 포레스트 → 네이비 Boardroom. 헤더 「시뮬레이션 다음 턴」(accessible name은 토론 시작). 홈 안건+업로드. 테이블 SVG 서류 6장. 하단 도크. 사이드바 6칸 유지. 단위 117. 배포·HTTPS E2E는 사용자 확인 후. 문서 `doc/progress/2026-08-31-boardroom-03.md`.




2026-08-31 Executor: 03 느낌이 달랐던 이유 — 사이드바 대시보드 + 빈 테이블 클로즈업. 홈을 풀블리드 회의실로 바꿈(헤더에 브랜드·아이콘 메뉴, 안건 카드 오버레이). 테이블에 서류가 깔린 장면 PNG. 유휴 말풍선 3개+역할 칩. 단위 테스트 후 사용자 확인.

2026-08-31 Executor: 풀블리드 오버레이도 03과 달랐다. 카드가 장면 위를 가려 진료진이 잘리고, 헤더가 밀려 「시뮬레이션 다음 턴」이 안 보였다. 시안대로 왼쪽은 회색 위 흰 카드, 오른쪽은 라운드 회의실. 장면 PNG를 사람 3명+서류 테이블로 교체. 안건 기본값은 시안 4줄. 사용자 확인 후 완료 표시.

2026-08-31 Executor: 업로드 후 손익계산서·진료과별 현황 등 SVG 카드가 장면 속 서류 위에 겹쳤다. 03은 테이블 서류가 PNG에만 있다. HTML 서류 오버레이와 스파클을 제거. 사용자 확인 대기.

2026-08-31 Executor: 서류 위 CFO·마케터·진료진 칩을 제거. 03 시안은 말풍선만 있고 테이블 이름표는 없다.

2026-08-31 Executor: 홈 도크 4칸이 같은 화면이었다. 회의록=/debate, 지표=/dashboard(올린 지표), 시나리오=/decision(메모만), AI 인사이트=/insights(반대·위험·필요 데이터, 4번째 LLM 없음).

2026-08-31 Executor: 안건 아래에 보이는 「토론 시작」을 둠. 헤더 「시뮬레이션 다음 턴」은 시안 유지(accessible name은 시뮬레이션 다음 턴). 둘 다 선택 창만 연다. 「올린 데이터로 진행」은 업로드가 있을 때만, 「그냥 진행」은 기본 합성 지표. 데이터 검토는 기존처럼 올린 지표+고정 안건. 실 LLM 버튼은 E2E에서 누르지 않음.

2026-08-31 Executor: 상단 메뉴를 하단 도크와 맞춤. 홈·회의록·지표 대시보드·시나리오 결과·AI 인사이트·파일 관리. 설정은 헤더 「설정」만. 페이지 제목도 같은 이름.

2026-08-31 Executor: 홈 상단 메뉴 글자를 숨기지 않음. 아이콘+이름, 네이비, 더 큰 터치 영역.

2026-08-31 Executor: 하단 플로팅 도크(회의록·지표 대시보드·시나리오 결과·AI 인사이트)를 홈·내부 페이지에서 지움. 상단·사이드 주요 메뉴는 유지. 테이블 PNG 손익계산서·타당성 검토 연도 2024→2026.


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
아이소메트릭 테이블에서 CSS `top`을 키우면 화면 아래 = 테이블 앞. 종이더미는 `translate(-50%, -100%)`로 박스 바닥을 테이블에 붙인다. 여우 앞(`top` 54%)은 뒤쪽, 바인더 삼각형(72%)은 앞쪽. 세 캐릭터 사이 빈 나무면은 바닥 약 61.5%. `.paper-pile-wrap { overflow: hidden }`는 그림자를 네모로 잘라 이질적으로 보인다. 타워 PNG를 창으로 자르거나 같은 타일을 반복하면 02 시안의 종이산이 아니다. 업로드 후는 `clay-paper-stack.png`를 통째로 둔다. PNG 바닥 네온과 노란 CSS 글로우가 겹치면 스티커처럼 뜬다. `sepia(1)`은 민트를 죽인다. 발치 라임을 회색으로 바꾸면 나무 위에 회판이 생긴다. 라임은 지우고(투명), 아랫장은 크림으로, 접촉은 나무색 AO, `sepia(0.1)`만. 같은 PNG URL은 브라우저가 네온 버전을 붙잡으니 `?v=`로 캐시를 깬다.

02 시안과 서류를 맞추려면 회의실과 다른 PNG를 올리면 안 된다. 바인더처럼 `forest-room-idle.png` / `forest-room-stacked.png`에 구워 넣는다. 아이소메트릭 서류 PNG를 나무 위에 합성하면 구워도 후광이 남는다. 원본 회의실에 서류를 인페인트해야 조명·원근이 같다.
`shouldShowPersonaBubble`이 `return false`면 토론이 시작돼도 홈 말풍선이 없다. 말풍선은 머리 위 점토 PNG(페르소나 색·꼬리 방향)이고, 이름표 칩은 다시 올리지 않는다.
월별 지표 CSV에 없는 열을 넣으면 예전 파서는 `알 수 없는 열`로 거절했다. 환자행(진료과·성별·나이대·지역)은 별도 헤더로 읽고 12개월로 합친다. `consult_to_surgery_rate`는 스키마가 0.55~0.70이라 집계 후 클램프한다.
토론 본문의 영문 키는 프롬프트 표 헤더가 영어라 모델이 베낀다. 표·evidence 예시를 한글로 두고, 저장된 세션은 DB를 고치지 않고 화면에서만 치환한다. CAC와 같이 한글 조사 앞은 `\b`가 안 맞는다.
03 시안은 헤더에 「시뮬레이션 다음 턴」이 있다. 왼쪽 안건 아래에 보이는 「토론 시작」을 둔다. 같은 accessible name을 헤더와 왼쪽에 두면 boundingBox가 깨진다. 헤더는 `aria-label="시뮬레이션 다음 턴"`. 「토론 시작」클릭은 선택 창만 연다. 실 LLM은 「올린 데이터로 진행」「그냥 진행」「데이터 검토」다. E2E는 그 셋을 누르지 않는다. 홈 업로드는 `#home-metrics-file`, `/files`만 `#metrics-file`. 테이블 차트는 recharts 없이 SVG. 인사이트용 4번째 LLM은 두지 않는다. 네 보기(회의록 `/debate` · 지표 `/dashboard` · 시나리오 `/decision` · 인사이트 `/insights`)는 상단·사이드 주요 메뉴만 쓴다. 하단 플로팅 도크는 두지 않는다. 설정은 헤더 버튼, 파일 관리는 상단 6칸에 남긴다. 인사이트는 기존 턴의 반대·위험·필요 데이터만 모은다.
03 시안 테이블 서류는 장면 PNG에 구워져 있다. 손익계산서·진료과별 현황 SVG 카드를 그 위에 올리면 시안과 다른 스티커가 된다. 업로드 여부는 `data-stack`만으로 두고, HTML 서류 오버레이는 그리지 않는다. 서류 연도(손익계산서 분기·타당성 검토)는 PNG에 있다. ImageMagick `-draw "text x,y"`의 y는 베이스라인이다. 홈 도크를 지우면 `.table-waiting-label` bottom을 5.6rem에서 내려야 한다.
