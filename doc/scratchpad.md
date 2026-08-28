# Boardroom (hem) — Scratchpad

원본 위치: `doc/scratchpad.md`. `.cursor/scratchpad.md`는 동일 내용을 유지한다.

## Background and Motivation

원티드 AI Championship 2026 Boardroom. GitHub: https://github.com/boam79/hem

## Key Challenges and Analysis

Supabase Free 2칸. 사용자 지시로 `qr-asset-manager` pause 완료. Boardroom DB 생성·마이그레이션됨. Vercel Production에 `SUPABASE_URL`만 있음. service role·LLM 키 없음.

## High-level Task Breakdown

Phase 0 완료. W1–W2 코드·배포. W1-4 DB 생성됨, Vercel 연결 남음. W3 실측·W4 영상은 키 대기.

## Project Status Board

- [x] P0 Cloud·git·푸시
- [x] W1-1~2 앱·스키마
- [x] W1-3 경량 ID: haiku / gpt-5.4-nano / flash-lite (키 실측은 배포 HTTPS)
- [x] Vercel Production 키 연결됨 (`/api/health` 4 true). 값은 문서에 적지 않음.
- [ ] 배포 HTTPS 실토론 F3–F6 (스키마 수정 배포 후 재시도)

## Executor's Feedback or Assistance Requests

2026-08-28: `qr-asset-manager` INACTIVE. 환자 DB 유지. Boardroom 테이블 4개.
폰에서 Vercel 프로젝트 boardroom → Environment Variables에 URL과 service_role을 넣으면 `/api/health`의 supabase가 true가 된다.
Anthropic 키는 계정에 없음. OpenAI·Gemini는 다른 프로젝트에 있음.

## Lessons

MCP `get_publishable_keys`는 anon만 준다. service_role은 대시보드. RLS off는 PRD MVP.
