# Boardroom agent instructions

한국어로 답한다. 역할은 `.cursor/scratchpad.md`의 Planner/Executor 규칙을 따른다. 진행 문서의 원본은 `doc/` 이다.

## Product

코드명 Boardroom. PRD: `doc/prd/PRD_v1.0.md`. 가치: 결정을 대신하지 않는다. 반대 논거·미확인 가정·필요 데이터를 올린다.

GitHub 원격은 **https://github.com/boam79/hem** 만 사용한다. origin.cursor.com 리모트를 만들지 않는다.

## Stack (PRD 확정)

- Next.js 15 App Router, TypeScript, pnpm
- AI SDK 7: `generateText` + `Output.object()`, 프로바이더 직접 연결 (Gateway 미사용)
- Supabase Free (서버 service role만), Vercel Hobby
- Tailwind + shadcn/ui

타임아웃 (PRD 모순 수정): 셀 abort **22초**, 재시도 포함 **28초** 하드캡, `maxDuration` **60**. F3는 30초 안에 3셀.

## Docs

진행 문서·계획·로그는 `doc/`에 추가한다. 채팅만으로 남기지 않는다.

- `doc/README.md` — 문서 인덱스
- `doc/scratchpad.md` — 상태 보드 (`.cursor/scratchpad.md`와 동기화)
- `doc/progress/` — 일자별 Executor 기록
- `doc/prd/` — 제품 문서

시크릿(`.env`, API 키)을 커밋하지 않는다.

## Tests

- 단위·스키마 테스트는 로컬/Cloud VM에서 실행해도 된다.
- E2E·스모크는 배포 HTTPS(프리뷰/프로덕션)만. Playwright baseURL에 localhost를 쓰지 않는다.

## Cursor Cloud specific instructions

Cloud Agent는 Ubuntu VM에서 이 리포를 클론한다.

- Node 20 + pnpm은 `.cursor/Dockerfile`이 설치한다.
- `install`: `package.json`이 있을 때만 `pnpm install`. 앱 골격 전에는 성공(no-op)해야 한다.
- 포트 3000. `pnpm dev`는 앱이 생긴 뒤에만 켠다. install에 장기 프로세스를 넣지 않는다.
- 시크릿은 Cursor Cloud Secrets 탭. 이름은 `.env.example`과 같다.
- 브랜치에서 작업하고 PR로 올린다. `main`에 직접 강제 푸시하지 않는다.
- 검증: `pnpm` 스크립트가 있으면 `pnpm test` / `pnpm build`. E2E는 배포 URL이 있을 때만.
- 작업이 끝나면 `doc/progress/YYYY-MM-DD-<topic>.md`에 무엇을 했는지 한 페이지로 남긴다.

## Out of scope (MVP)

자동 메모, 라운드 3, 페르소나 편집 UI, 인증·RLS, 실데이터 업로드, 토큰 스트리밍, 비용 대시보드.
