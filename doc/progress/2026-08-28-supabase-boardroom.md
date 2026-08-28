# 2026-08-28 Supabase Boardroom 생성

사용자 지시: `qr-asset-manager` pause. 환자 DB(`boam79_patient_data`)는 그대로 둠.

## 결과

| 항목 | 상태 |
|---|---|
| qr-asset-manager | **INACTIVE** |
| boardroom 프로젝트 | `tbtjdfayqgcdywybczjr` ACTIVE_HEALTHY, ap-northeast-2 |
| API URL | `https://tbtjdfayqgcdywybczjr.supabase.co` |
| 마이그레이션 | `sessions`, `turns`, `rate_limits`, `keepalive` 생성, 행 0 |
| RLS | PRD대로 비활성. anon 키는 클라이언트에 넣지 않음 |

## 아직

- Vercel Production(+Development)에 `SUPABASE_URL` 넣음. **service_role 키는 MCP가 안 줌.** 대시보드에서 복사해 Vercel·Cloud Secrets에 넣어야 `/api/health`의 supabase가 true.
- Anthropic 키는 이 계정 Vercel 프로젝트 어디에도 없음. OpenAI는 `aiinterview`, Gemini는 `policy_fund`에 있음.

## 모바일에서 볼 곳

- 프로덕션: https://boardroom-six-delta.vercel.app
- 공유 백업: https://boardroom-six-delta.vercel.app/s/w4demo
- 슬라이드: https://boardroom-six-delta.vercel.app/demo/slide
- PR #2 프리뷰(데모 재생): https://boardroom-git-cursor-w4-caf90b-ckadltmfxhrxhrxhr-5008s-projects.vercel.app
