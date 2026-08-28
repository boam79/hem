# 2026-08-28 Haiku R2 빈 objection

배포: https://boardroom-six-delta.vercel.app  
코드: `ba66843` (production READY `dpl_GPqZNkUpdsiK9hN9KSRCkdvGPQL3`)  
키 값은 적지 않음. 경량 3사 유지: haiku / gpt-5.4-nano / flash-lite. 큰 모델로 올리지 않음.

전체 PRD 완료로 단정하지 않음. 이번 한 가지는 Haiku(cfo) 라운드 2 빈 `objection`/`changed` 비율을 낮추는 것.

## 원인

AC 감사 eval 5안건 중 4건에서 cfo(Haiku) R2가 `round2 requires non-empty objection and changed`로 failed. 성공 셀의 objection은 채워져 있었음.

- Haiku가 R2에서도 R1처럼 `objection`/`changed`를 빈 문자열로 냄. 스키마는 `z.string()`이라 structured output이 빈 값을 통과시킴.
- jsonrepair는 빈 문자열 JSON을 “복구”해도 파서가 거절함. 복구가 성공이 아님.
- 재시도 예시 JSON이 `position`을 앞에, `objection`을 뒤에 둠. 400토큰 한도에 걸리면 F4 필드가 잘리거나 빈 채로 남기 쉬움.
- 첫 호출 시스템 프롬프트에 R2 최소 예시가 없고, 빈 필드 전용 재시도 문구도 없음.

## 수정

- `lib/prompt.ts`: R2 최소 예시에서 objection/changed를 맨 앞. 첫 호출에 Haiku 한 줄 규칙. 빈 필드면 `round2EmptyRetrySuffix`로 한 번 더 호출.
- `lib/llm.ts`: R2 첫 시스템 프롬프트에 예시. 빈 objection 거절 후 전용 재시도 경로.
- `lib/schema.ts`: `ROUND2_EMPTY_FIELDS_ERROR` + `isRound2EmptyFieldError`. LLM 스키마 `.describe()`로 빈 값 금지 안내(min/max는 OpenAI 때문에 넣지 않음).
- `config/personas.ts` `ROUND2_RULES`: 따옴표 없는 짧은 한국어 한 문장, 키를 맨 앞, position은 objection보다 짧게.

출력 토큰 한도 400, abort 22 / 재시도 캡 28 / `maxDuration = 60` 그대로.

## 단위 테스트

`pnpm test` 40 passed. 공백-only 거부, jsonrepair 빈 objection은 파싱 실패, 빈 필드 에러가 empty-r2 재시도 프롬프트로 가는지, 최소 예시 키 순서. `pnpm build` 통과.

## HTTPS 새 세션 3개 (이전 실패 안건)

health 4 true. R1 회귀: 세 세션 모두 ok=3, 30초 이내.

| 세션 | 안건 | R1 ok / ms | R2 ok / ms | cfo objection |
|---|---|---|---|---|
| `cA_9I2` | 스마일 전용 레이저 리스 계약 12개월 | 3 / 10077 | 3 / 6987 | ok, 154자 |
| `4e4XEM` | 백내장 검색광고 예산 30% 증액 | 3 / 7942 | 3 / 8251 | ok, 43자 |
| `NQSmdi` | ICL 패키지 가격 8퍼센트 인하 | 3 / 7967 | 3 / 8409 | ok, 25자 |

세 세션 모두 R2 okCount=3 (기준은 >=2). 셀 에러 없음.

공유:
- https://boardroom-six-delta.vercel.app/s/cA_9I2
- https://boardroom-six-delta.vercel.app/s/4e4XEM
- https://boardroom-six-delta.vercel.app/s/NQSmdi

`/s/4e4XEM` HTTPS HTML에 라운드 2 `반대:` 3칸(재무 회수 경로 문구 포함). 브라우저 탭 도구는 이번 환경에서 기동되지 않아 HTML로 확인.

## 사용자에게

완료로 단정하지 않음. 위 세 URL에서 라운드 2 재무 칸에 반대(objection)가 보이는지 확인해 주세요. W3 5×10·keepalive는 이번 범위 밖.
