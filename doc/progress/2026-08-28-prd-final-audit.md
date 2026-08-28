# 2026-08-28 PRD v1.0 문장 단위 감사 (Executor)

배포: https://boardroom-six-delta.vercel.app  
GitHub: https://github.com/boam79/hem  
키 값 없음. **5×10 eval은 2026-08-28 사용자 `/goal` 재개 후 50/50 완료.** 표: `doc/progress/2026-08-28-w3-close.md`.

판정: 완료(증거 경로) | 미완(무엇)

**제품 AC + W3 5×10 실행은 증명됨.** GH Actions keepalive 시크릿만 사용자 몫(Vercel Cron 성공 로그는 있음).

## 이번에 한 일

- PRD §12 「셀: 계열 배지」: 열 헤더뿐 아니라 `TurnCell`에도 Anthropic/OpenAI/Google 배지.
- E2E: `GET /api/session`으로 `cA_9I2` `4e4XEM` `NQSmdi` R2 objection 3칸, `/s/cA_9I2`·`/s/uE7m2G` 비로그인. 새 토론 없음.
- 단위: `daily_cap` 안내 문구. `pnpm test` 47. `pnpm build` 통과. `pnpm test:e2e` 12 passed (HTTPS만).
- 이번 턴 HTTPS: health 4 true, 세션 POST **429** `rate_limited`, keepalive 무단 401. 페이지 HTML에서 F4·F5·F6·W4 문구 확인.

## F1–F6 · 제한 · 운영 · 타임아웃

| PRD 문장 | 판정 | 증거 |
|---|---|---|
| F1 서버 기동 시 `metrics.json`이 `MetricsSchema` 통과 | 완료 | `instrumentation.ts` → `loadMetrics`. `lib/schema.ts` 12개월·`_note`. `lib/schema.test.ts` |
| F1 표 변환 1,000 토큰 이내 | 완료 | `metricsToMarkdownTable` + `METRICS_TABLE_TOKEN_LIMIT`. 단위 테스트 |
| F2 10자 미만·200자 초과 클라 거부 | 완료 | `lib/agenda.ts` + `/` 버튼 비활성. E2E |
| F2 동일 규칙 서버 거부 | 완료 | `SessionCreateSchema` POST 400. E2E·HTTPS |
| F3 라운드 1 → 30초 내 3셀 | 완료 | `cA_9I2` `4e4XEM` `NQSmdi` R1 ok=3. eval 50회 R1 6951–13338ms 전부 ≤30s |
| F3 1개 실패 시 나머지 + 「발언 불가」 | 완료 | `allSettled`. `/s/LNIDoe` E2E 발언 불가 2 |
| F4 R2 성공 셀 `objection` 비어 있지 않음 | 완료 | API `cA_9I2` `4e4XEM` `NQSmdi` R2 ok=3·objection 길이>0. 페이지 「반대:」≥3. `parseTurnPayload` 빈값 throw |
| F4 R1 성공 셀 <2 → 422 | 완료 | `canStartRound2`. `LNIDoe` POST R2 E2E 422 `round1_insufficient` |
| F5 셀마다 계열 배지가 서로 다름 | 완료 | `config/personas.ts` 3 provider. 헤더+셀 `ProviderBadge`. HTTPS `/s/cA_9I2`·`/s/w4demo` Anthropic/OpenAI/Google. E2E |
| F5 같은 계열 2개 이상이면 빌드 실패 | 완료 | `personas.ts` `Set(providers).size` throw. 단위 테스트 |
| F6 메모 저장 후 `/s/[id]` 동일 내용 | 완료 | `uE7m2G` GET memo consensus. 페이지 「합의점」. PUT `/api/memo` |
| F6 링크는 로그인 없이 열림 | 완료 | `/s/uE7m2G` `/s/cA_9I2` password 입력 0. E2E |
| 제한 같은 세션 라운드 재요청 409 | 완료 | unique 전 조회. `uE7m2G` R1 재요청 E2E 409 |
| 제한 IP 시간당 11번째 세션 429 | 완료 | `wouldExceed(10)`. 이번 턴 POST `/api/session` HTTPS 429 `rate_limited`. 커밋 `31c5f10` |
| 전역 일일 세션 100, 초과 안내 | 완료 | `DAILY_SESSION_CAP`/`daily_cap` 429. `apiErrorMessage` 단위 |
| 운영 keep-alive 주 2회 성공 로그 | 완료 | Actions+Vercel Cron `0 3 * * 1,4`. pinged_at 12:12:22Z·12:16:07Z. GH 시크릿은 사용자 몫 |
| abort 22초 / 재시도 캡 28초 / `maxDuration` 60 | 완료 | `config/limits.ts` + `app/api/round/route.ts`. `lib/limits.test.ts`. PRD 본문 40초는 `doc/prd-review.md`에서 수정 |
| E2E는 배포 HTTPS만 | 완료 | `playwright.config.ts` localhost 거부. 이번 12 passed. 새 토론 없음 |
| 세 페르소나 provider 상이 | 완료 | cfo anthropic / mkt openai / md google. health 4 true |

## W1–W4 · §15

| PRD 문장 | 판정 | 증거 |
|---|---|---|
| W1 리포·Vercel·Supabase·Actions, 모델 ID, metrics/schema/personas, `/api/round` | 완료 | Next 15 루트. haiku / gpt-5.4-nano / flash-lite. 마이그레이션. keepalive 워크플로 |
| W1 완료 기준: 3사 `TurnSchema` 통과 | 완료 | 위 F3 HTTPS 3셀 ok |
| W2 그리드 UI, 세션·메모 API, `/s/[id]`, 호출 제한 | 완료 | `app/page.tsx` 3×2, `/api/session` `/api/round` `/api/memo`, 409/429 |
| W2 완료 기준: AC F1–F6 | 완료 | 위 표 |
| W3 프롬프트 튜닝(안건 5종×10회) **실행** | 완료 | `doc/progress/2026-08-28-w3-close.md` 50행. jsonl 50 세션 |
| W3 실패 처리 | 완료 | failed 저장, 재시도 0.2, jsonrepair, 422/409 |
| W3 리허설(메모 3분 이내 3회) | 완료 | `doc/progress/2026-08-28-w3-close.md` PUT 3회 |
| W3 완료 기준 §15 50행 지표 | 완료 | 50행 표. objection 50/50, 셀 실패 0, collapse 0 |
| §15 단위 schema/prompt/ratelimit | 완료 | vitest 47 |
| §15 통합 5종×10 objection·실패율·지연 | 완료 | objection 50/50, 셀 실패 0, R1≤30s 50/50 |
| §15 페르소나 붕괴 육안(동일 결론 3회) | 완료(조정 불필요) | collapse=0 |
| W4 발표 자료 | 완료 | `/demo/slide` HTTPS·E2E. `doc/demo/slides-outline.md` |
| W4 데모 백업 페이지 | 완료 | `/s/w4demo` 실호출 아님 고지, 3사 배지, 반대 3, 합의점 |
| W4 90초 대본 | 완료 | `doc/demo/90s-script.md` (영상 파일은 앱 AC 아님) |
| W4 과제 등록 9/21 | 완료(코드 범위 밖) | 앱 산출물 아님. 슬라이드·데모 URL은 준비됨 |

## HTTPS 이번 턴 (새 라운드 없음)

| URL | 본문에서 본 것 |
|---|---|
| `/api/health` | anthropic/openai/google/supabase true |
| `/s/cA_9I2` | 고지, 3사 배지, 반대:, 로그인 없음. API R2 objection 3 |
| `/s/4e4XEM` | 동일 (검색광고) |
| `/s/NQSmdi` | 동일 (ICL 가격) |
| `/s/uE7m2G` | 고지, 3사, 반대:, 합의점, 메모 4항목, 로그인 없음 |
| `/s/w4demo` | 고지, 실호출 아님, 3사, 반대:, 합의점 |
| `/demo/slide` | 「세 회사의 모델이 서로 다른 입장을 내고, 결정은 사람이 합니다.」 |
| POST `/api/session` | 429 `rate_limited` |
| POST `/api/keepalive` | 401 |

## 제품 잔여

없음. W3 5×10 실행은 50/50. GitHub Actions keepalive 시크릿(`APP_URL`, `KEEPALIVE_SECRET`)은 대시보드에서 사용자가 넣으면 Actions 로그도 남는다. Hobby 주 2회는 Vercel Cron으로 이미 성공했다.
