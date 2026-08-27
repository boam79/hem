# MCP 연결 기록 (2026-08-28)

요청: Executor가 착수할 때 사용 가능한 MCP를 활용한다. 제품과 무관한 서버(법령, 정부지원, 감가상각, Figma, AWS IaC, Harness)는 인증만 돌리지 않고 상태를 적는다.

| 네임스페이스 | 상태 | 이번 턴에서 |
|---|---|---|
| user-context7 | ready | Next.js maxDuration, App Router 조회 |
| plugin-context7-plugin-context7 | ready | AI SDK `Output.object`, `timeout`/`abortSignal` 조회 |
| plugin-supabase-supabase | 인증 성공 | `list_projects` — 활성 2개 (Free 한도) |
| plugin-vercel-vercel | 인증 성공 | Hobby 팀, hem 프로젝트 없음 |
| user-render | ready | 워크스페이스 `boam`, hem 서비스 없음 (배포는 Vercel) |
| user-Supabase | error | 디스커버리 실패. plugin-supabase 사용 |
| user-filesystem | error | 로컬 Read/Write로 대체 |
| user-server-sequential-thinking | 없음 | 카탈로그에 없음 |
| plugin-vercel-vercel 시크릿 | n/a | 키는 대시보드. 리포에 안 넣음 |
| cursor-ide-browser / playwright | ready | 배포 URL 생기기 전 E2E 생략 |
| plugin-harness-harness, AWS*, korean-law, gov-support, Figma, public-data, depreciation | 존재 | Boardroom Phase 0과 무관해 미호출 |

## 실측이 결정에 준 것

- Supabase Free 활성 프로젝트 2개가 이미 찼다 (`qr-asset-manager`, `boam79_patient_data`). `policyfund-ai-v2`는 INACTIVE. W1에서 Boardroom용 프로젝트를 만들려면 하나 pause 또는 새 프로젝트 한도 확인이 필요하다.
- Vercel Hobby 팀 `team_U7AuO5lMD3rtoAwkrj410jpx`. hem 링크 프로젝트 없음. 푸시 후 import.
- Render는 기존 서비스만. PRD 배포 타깃은 Vercel.
- `git ls-remote https://github.com/boam79/hem.git` 성공, refs 없음 → **빈 리포가 이미 있다.**
