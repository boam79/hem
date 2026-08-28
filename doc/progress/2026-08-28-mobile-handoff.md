# 모바일·Cloud 이어서 (2026-08-28)

노트북을 닫아도 GitHub `boam79/hem` main과 이 문서만 보면 된다. 로컬 파일에 의존하지 말 것.

## 지금 상태 (증거)

- `qr-asset-manager` (`hiwspxrnkuvqkujvwjro`) **pause 요청 성공** (당시 상태 PAUSING). 환자 DB `boam79_patient_data`는 그대로 둠.
- Boardroom Supabase **생성됨**: 이름 `boardroom`, ref `tbtjdfayqgcdywybczjr`, 서울 `ap-northeast-2`, 상태 ACTIVE_HEALTHY.
- URL: `https://tbtjdfayqgcdywybczjr.supabase.co` (값은 시크릿 아님)
- 마이그레이션 `init_boardroom` 적용. 테이블: `sessions`, `turns`, `rate_limits`, `keepalive`. RLS는 PRD대로 꺼져 있음(인증 없음 MVP). **anon 키를 `NEXT_PUBLIC_`에 넣지 말 것.**
- Vercel Production(+ Development)에 `SUPABASE_URL`만 넣음. **service role 키는 MCP가 안 줌 → 아직 없음.**
- `/api/health`는 3사 LLM 키 + service role이 있어야 `true`.

배포: https://boardroom-six-delta.vercel.app  
백업 공유: https://boardroom-six-delta.vercel.app/s/w4demo  
슬라이드: https://boardroom-six-delta.vercel.app/demo/slide

## Cloud Agent가 할 일 (순서)

1. Cursor Cloud Secrets와 Vercel Production에 아래를 넣는다. 값은 대시보드에서만 복사. 커밋 금지.
   - `SUPABASE_SERVICE_ROLE_KEY` — [API 설정](https://supabase.com/dashboard/project/tbtjdfayqgcdywybczjr/settings/api) 의 service_role
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - (선택) `KEEPALIVE_SECRET` — GitHub Actions `APP_URL`=`https://boardroom-six-delta.vercel.app` 과 동일 값
2. Vercel 재배포 후 `GET https://boardroom-six-delta.vercel.app/api/health` 가 네 키 모두 true인지 확인.
3. 배포 HTTPS에서만 E2E: `PLAYWRIGHT_BASE_URL=https://boardroom-six-delta.vercel.app pnpm test:e2e`
4. 안건 "백내장 검색광고 예산 30% 증액"으로 라운드 1이 30초 안에 3셀인지(F3), 라운드 2 `objection`인지(F4), 메모 저장 후 `/s/[id]` 새로고침(F6).
5. 실측 기록은 `doc/progress/` 에 한 페이지로 남기고 `origin` (`https://github.com/boam79/hem`) 만 푸시. `origin.cursor.com` 만들지 말 것.

키가 Cloud Secrets에 없으면 토론 API는 실패한다. 백업 페이지 `/s/w4demo`로 발표만 가능.
