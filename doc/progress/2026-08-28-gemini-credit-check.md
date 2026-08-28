# 2026-08-28 Gemini 크레딧 실측

배포: https://boardroom-six-delta.vercel.app  
커밋: `70b69f5` (production READY)  
세션: `LNIDoe`  
안건: 백내장 검색광고 예산 30% 증액  
키 값은 적지 않음. `/api/health`는 anthropic/openai/google/supabase 모두 true.

## 모델 (경량, 3사 서로 다름)

| 셀 | provider | modelId |
|---|---|---|
| cfo | anthropic | `claude-haiku-4-5-20251001` |
| mkt | openai | `gpt-5.4-nano` |
| md | google | `gemini-3.1-flash-lite` |

## 라운드 1 (HTTPS POST `/api/round`)

- 벽시계: **22966ms** (30초 안)
- HTTP 200

| 셀 | status | latencyMs | 비고 |
|---|---|---|---|
| cfo | failed | 19886 | JSON 파싱 실패 (`Expected ',' or ']' after array element`) |
| mkt | failed | 12857 | JSON 파싱 실패 (`Expected ',' or '}' after property value`) |
| md | **ok** | **1236** | 크레딧 에러 없음. 한국어 position 수신 |

## Gemini 결론

결제 반영됨. `prepayment credits are exhausted` / `모델 크레딧이 부족합니다.` 는 이번 호출에 없음.  
md 셀 성공 → Google 키와 결제 프로젝트가 프로덕션과 맞다.

## F3–F6

- F3 시간: 충족 (3셀 22.9초). 성공 셀은 1개라 **2성공+1실패 기준은 미충족**. R2 미실행(게이트 ok&lt;2).
- F4·F6: 이번 세션에서는 진행하지 않음.

## 다음에 코드로 할 일

Haiku·nano JSON이 400토큰에서 잘리거나 깨진다. 모델 ID는 올리지 않고 추출/출력만 고친다.
