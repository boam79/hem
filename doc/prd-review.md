# PRD 검토 (2026-08-28)

원본: [prd/PRD_v1.0.md](prd/PRD_v1.0.md)

## 판정

착수 가능한 문서. API·스키마·AC·실패 처리가 코드 수준이다. 오늘이 W1 시작일.

## 코딩 전 수정

1. **타임아웃 모순 (블로커)** — F3 30초 vs abort 40초 vs maxDuration 60 vs 재시도 시 80초.
   - 구현 값: abort **22초**, 재시도 포함 **28초** 캡, `maxDuration` **60**.
2. **`/api/keepalive` 없음 (블로커)** — env와 Actions만 있고 라우트가 아키텍처 트리에 없다. W1-4에서 추가.
3. **R2 `changed`** — 프롬프트 필수, Zod는 optional. objection만 코드 검증.
4. **공유 링크** — nanoid(6) + 인증 없음 + 메모 PUT 덮어쓰기. MVP 범위로 두되 쓰기 토큰은 W2에서 검토.

## 유지

- `generateText` + `Output.object()` (AI SDK 6+ 가이드와 일치, Context7 2026-08-28 확인)
- Hobby 비상업, 프로바이더 직접 연결(3사 배지), 셀 단위 `allSettled`

## 발표에서 하지 않을 말

"결론이 더 정확하다", "페르소나가 실제 직군을 재현한다".
