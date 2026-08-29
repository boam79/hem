# 2026-08-29 사용량·페르소나 편집·비용·스트리밍

사용자 `/goal`: 설정에서 API 사용량(또는 남은 양), 페르소나 편집, 비용 대시보드, 토큰 스트리밍.

## 설계

- **사용량/잔여**: 각 사 계정 잔액은 API 키만으로 조회할 수 없다. Boardroom `turns.usage`를 UTC 월 집계하고, `app_settings.monthly_budget_usd`(기본 $10) 대비 잔여를 보여 준다. Anthropic·OpenAI·Google 콘솔 링크를 붙인다. 요금은 `lib/cost.ts` 추정치다.
- **페르소나 편집**: `persona_overrides`에 이름·역할·습관·temperature만 저장. 프로바이더·modelId는 코드 고정(F5).
- **스트리밍**: 홈은 `POST /api/round/stream` SSE. 기존 `POST /api/round` JSON은 E2E 409/422용으로 유지.

## 코드

- 마이그레이션 `supabase/migrations/003_cost_personas.sql`
- `GET/PATCH /api/usage`, `GET/PUT/DELETE /api/personas`, `POST /api/round/stream`
- 설정 `/settings` 편집 폼 + 사용량, 대시보드 `/dashboard` 비용 패널
- 홈 말풍선은 SSE `delta`를 `streamPreview`로 표시

## 검증

- 단위: `pnpm test` 77
- 빌드: `pnpm build`
- HTTPS E2E **21 passed** (https://boardroom-six-delta.vercel.app). 설정 필드·남은 예산, 대시보드 비용, GET usage/personas, PUT 후 복구, stream 409. **유효 안건으로 토론 시작은 누르지 않음.**
- 브라우저: 설정에서 사용량·남은 예산·페르소나 저장/기본값 복구, 대시보드 비용 패널 확인.
