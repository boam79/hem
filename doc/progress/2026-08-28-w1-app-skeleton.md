# 2026-08-28 W1 앱 골격

## 한 일

- 리포 루트에 Next.js 15.5 App Router + TS + pnpm + Tailwind 4 (PRD의 `apps/boardroom` 대신 루트. Vercel·Cloud install이 package.json을 루트에서 찾기 때문).
- `lib/schema.ts`, `config/personas.ts`(3사 provider 가드), `data/metrics.json`(12개월 합성), `lib/prompt.ts`, `lib/llm.ts`(abort 22초, 재시도 예산 28초).
- API: `/api/session` `/api/round` `/api/memo` `/api/keepalive`. round `maxDuration = 60`.
- 단위 테스트 8개 통과. `pnpm build` 성공.
- SQL: `supabase/migrations/001_init.sql`. Actions: `.github/workflows/keepalive.yml`.
- 홈 `/` 안건 폼 + 그리드. `/s/[id]` 읽기 전용.

## 아직

- Supabase 프로젝트: Free 활성 2/2. 새 프로젝트는 만들지 않음. 키가 없으면 API는 503.
- OpenAI·Google 모델 ID는 후보 기본값. 실측(W1-3)은 API 키 필요.
- shadcn/ui CLI는 이번 커밋에 넣지 않음. 네이티브 textarea/select/button.
- Vercel 배포는 이 커밋 푸시 뒤에 연결.

## 검증

```
pnpm test   # 8 passed
pnpm build  # Next.js 15.5.24 성공, 라우트 / /s/[id] /api/*
```
