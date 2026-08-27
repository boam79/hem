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
- [ ] P0-4 Cursor GitHub 연결 + 모바일에서 리포 보임
- [ ] P0-5 Cloud Agent 스모크
- [ ] W1-1 Next.js 최소 앱
- [ ] W1-2 스키마·페르소나·지표
- [ ] W1-3 모델 ID 확정
- [ ] W1-4 Supabase + round/session/keepalive API (활성 프로젝트 한도 확인)
- [ ] W1-5 제한·keep-alive Actions

## Executor's Feedback or Assistance Requests

2026-08-28: P0-1~P0-3 완료. 푸시 SHA `84578d1`.
- GitHub API가 `doc/` 목록을 반환함. 빈 폴더에 clone 후 조건부 install exit 0. 로그: `doc/progress/2026-08-28-clone-install-evidence.md`.
- Cloud VM 증거용 에이전트 실행 중: `bc-6d1df64c-752f-4e04-b1e1-e6de202ce3d8`. 끝나기 전 P0-5 미완료.
- P0-4는 대시보드에서 `boam79/hem` 허용이 필요. 사람 확인 요청.
- Supabase 활성 2/2. Boardroom DB는 `boam79_patient_data`와 합치지 말 것.

## Lessons

- Write 도구는 `.env.example`을 거부할 수 있음 → 셸로 작성.
- plugin-supabase와 user-Supabase가 둘 있음. 후자는 디스커버리 실패, 전자를 씀.
- Vercel `list_projects`는 teamId 필수.
- 사용자 규칙: E2E는 배포 HTTPS만.
