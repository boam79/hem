# Boardroom (hem) — Scratchpad

이 파일은 `doc/scratchpad.md`와 동기화한다. 상세 문서는 `doc/`를 본다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. 원격 https://github.com/boam79/hem
진행 문서: `doc/`

## Key Challenges and Analysis

Cloud 조건부 pnpm. 모바일은 GitHub 연결 필수. 타임아웃 22s/28s/60s. Supabase Free 활성 2칸 점유. Vercel env 0개.

## High-level Task Breakdown

Phase 0 Cloud 골격·git·푸시. Phase 1 PRD W1–W4. 실토론은 키·DB 대기.

## Project Status Board

- [x] P0-1 Cloud용 리포 골격 파일
- [x] P0-2 git init + origin + 첫 커밋
- [x] P0-3 GitHub 푸시
- [x] P0-4 Cursor GitHub 연결 (Cloud 클론으로 확인)
- [x] P0-5 Cloud Agent 스모크 (`44812fd`)
- [x] W1-1 Next.js 최소 앱
- [x] W1-2 스키마·페르소나·지표
- [ ] W1-3 모델 ID 확정 (공개 ID 일치, 키 실측 전)
- [ ] W1-4 Supabase 프로젝트
- [x] W1-5 keep-alive Actions 파일
- [x] W2 UI·메모·공유 백업 `/s/w4demo`
- [x] W3 평가 프로토콜·스크립트
- [x] W4 `/demo/slide`

## Executor's Feedback or Assistance Requests

실토론 AC를 열려면 `qr-asset-manager` pause 여부와 Vercel 키 5종이 필요하다.

## Lessons

`.env.example`은 셸로 작성. Vercel list는 teamId 필요. E2E는 배포 URL만.
