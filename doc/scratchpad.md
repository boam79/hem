# Boardroom (hem) — Scratchpad

원본 위치: `doc/scratchpad.md`. `.cursor/scratchpad.md`는 동일 내용을 유지한다.

## Background and Motivation

원티드 AI Championship 2026 **병원 경영회의 시뮬레이터** (Boardroom).
GitHub: **https://github.com/boam79/hem**
오늘(2026-08-28) W1 시작. 진행 문서는 `doc/`에 기록.

## Key Challenges and Analysis

(Planner 기록 유지) Cloud install은 `package.json`이 있을 때만 pnpm. 모바일은 GitHub 연결 필수. 시크릿 미커밋. PRD 타임아웃은 22s/28s/60s. E2E는 배포 URL만. Supabase Free 활성 2칸이 이미 찼음.

## High-level Task Breakdown

Phase 0: Cloud 골격 → git → push → Cursor GitHub 연결 → Cloud 스모크.
Phase 1: PRD W1 (타임아웃 수정 + keepalive 라우트).

상세: `doc/cloud-mobile-setup.md`, `doc/prd-review.md`.

## Project Status Board

- [x] P0-1 Cloud용 리포 골격 파일
- [x] P0-2 git init + origin + 첫 커밋 (`5b9b470`)
- [x] P0-3 GitHub 푸시 (`boam79/hem` main)
- [x] P0-4 Cursor GitHub 연결 (Cloud가 `boam79/hem` 클론 성공으로 확인. 폰 목록은 새로고침)
- [x] P0-5 Cloud Agent 스모크 (`44812fd`, install exit 0, Linux `cursor`)
- [x] W1-1 Next.js 최소 앱 (`pnpm build` 성공, 루트 앱)
- [x] W1-2 스키마·페르소나·지표 (vitest 8)
- [ ] W1-3 모델 ID 확정 (공개 ID는 후보와 일치, **키 실측 전**)
- [ ] W1-4 Supabase 프로젝트+마이그레이션 (SQL은 커밋됨, Free 2/2)
- [x] W1-5 keep-alive Actions 파일
- [x] W2 그리드·메모 폼·공유 페리·`/s/w4demo` (실DB 없는 AC F3–F6는 미통과)
- [x] W3 평가 프로토콜·스크립트 (실측 10회는 키 대기)
- [x] W4 90초 스크립트·`/demo/slide` (실발표 영상은 미촬영)

## Executor's Feedback or Assistance Requests

2026-08-28: Phase 0 목표 증거 충족.
- Cloud VM hostname `cursor`, SHA `8134cb5`, install exit 0. 파일: `doc/progress/2026-08-28-cloud-clone-evidence.md` (`44812fd`).
- 폰에서 리포가 안 보이면 앱 목록을 당겨 새로고침하면 된다. 연결 자체는 Cloud 클론으로 확인됨.
2026-08-28 W2: shadcn 그리드·메모 4항목·셀 skeleton·`/s/w4demo` 백업·health API.
실토론 AC는 Supabase 슬롯(사용자 pause 선택)과 3사 키가 필요하다. 새 프로젝트 비용 조회는 월 $0.
HTTPS Playwright 3/3 통과. `/api/health`는 키·DB 모두 없음. Vercel env 0개.
실토론을 열려면 `qr-asset-manager` pause 여부와 3사+Supabase 키를 Vercel에 넣어야 한다.

## Lessons

- Write 도구는 `.env.example`을 거부할 수 있음 → 셸로 작성.
- plugin-supabase와 user-Supabase가 둘 있음. 후자는 디스커버리 실패, 전자를 씀.
- Vercel `list_projects`는 teamId 필수.
- 사용자 규칙: E2E는 배포 HTTPS만.
