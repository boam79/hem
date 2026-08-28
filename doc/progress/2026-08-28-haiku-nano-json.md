# 2026-08-28 Haiku·nano JSON 복구

배포: https://boardroom-six-delta.vercel.app  
커밋: `32168f5` (production READY)  
키 값은 적지 않음.

## 원인

프로덕션 세션 `LNIDoe` R1에서 md만 성공. cfo(Haiku)는 `Expected ',' or ']' after array element`, mkt(nano)는 `Expected ',' or '}' after property value`. 닫는 `}`가 없는 잘린 JSON은 기존 추출기가 바로 버렸고, 문자열 안 따옴표·줄바꿈·배열 쉼표 누락은 trailing-comma 치환만으로는 복구되지 않았다. OpenAI structured output에는 `.optional()`/`min`/`max`가 맞지 않아 텍스트 JSON으로 떨어질 수 있다.

## 수정 (경량 3사 유지)

- `lib/json.ts`: `jsonrepair`로 깨진/잘린 JSON 복구. `}`가 없어도 `{`부터 복구.
- `lib/schema.ts`: `TurnLlmSchema`는 모든 키 필수, `.optional()`·min/max 없음. 파싱 후 `parseTurnPayload`로 길이 클립.
- `lib/llm.ts`: Output.object에 LLM 스키마 사용. 재시도 시 JSON 전용 예시.
- `config/personas.ts`: 문자열 안 큰따옴표·줄바꿈 금지 한 줄.

모델 ID는 그대로: haiku / gpt-5.4-nano / gemini-3.1-flash-lite.

## 단위 테스트

`pnpm test` 26 passed. 픽스처: 배열 안 따옴표, 배열 쉼표 누락, 속성 값 따옴표, 잘린 JSON, 문자열 줄바꿈, LLM 스키마 필수 키, 길이 클립. `pnpm build` 통과.

## HTTPS 새 세션 (이전 `LNIDoe`는 409라 재사용 안 함)

안건: 백내장 검색광고 예산 30% 증액  
세션: `4fyIcc`  
공유: https://boardroom-six-delta.vercel.app/s/4fyIcc

### 라운드 1 — 벽시계 10067ms, HTTP 200, okCount=3

| 셀 | provider | modelId | status | latencyMs | 에러 |
|---|---|---|---|---|---|
| cfo | anthropic | `claude-haiku-4-5-20251001` | ok | 5824 | 없음 |
| mkt | openai | `gpt-5.4-nano` | ok | 6386 | 없음 |
| md | google | `gemini-3.1-flash-lite` | ok | 1309 | 없음. 크레딧 에러 없음 |

### 라운드 2 — 벽시계 24058ms, HTTP 200, okCount=1

| 셀 | status | latencyMs | 에러 |
|---|---|---|---|
| cfo | failed | 21415 | `Colon expected at position 570` |
| mkt | failed | 13229 | `objection` 빈 문자열 (too_small) |
| md | ok | 1845 | 없음 |

R2는 이번 작업 범위 밖. 기록만.

## 사용자에게

완료로 단정하지 않음. 사이트에서 세션 `4fyIcc` 라운드 1 세 칸이 발언을 보여 주는지 확인해 주세요.
