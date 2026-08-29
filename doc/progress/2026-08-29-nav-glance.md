# 2026-08-29 메뉴·한눈 토론

홈 사이드바에서 안건·유형을 파일 업로드 위로 옮기고, 토론 결과는 R1·R2를 한 카드에 압축했다. 대시보드·의사결정·설정은 장식이 아니라 실제 라우트다.

## 메뉴에 넣은 기능 (MVP, PRD 제외 항목을 넣지 않음)

| 메뉴 | 경로 | 기능 |
|---|---|---|
| 대시보드 | `/dashboard` | `/api/health` 3사+Supabase 연결 여부, 이 브라우저 최근 세션, 더미 CSV/엑셀, 데모 `/s/w4demo` |
| 의사결정 | `/decision` | 최근 세션 또는 `?id=` 사회자 메모. 압축 토론 + `MemoForm`. 데모 `w4demo`는 읽기 전용 |
| 설정 | `/settings` | 페르소나 이름·프로바이더·모델 ID·역할 **읽기 전용**. 편집 UI 없음 |

비용 대시보드·인증·페르소나 편집은 PRD MVP 제외라 만들지 않았다.

## 토론 한눈에

홈과 의사결정 페이지는 `DebateGlance`: 페르소나 3열, 각 카드에 R1 입장·R2 입장·반대·변경. 근거·리스크는 `<details>`. 공유 `/s/[id]`는 기존 `DebateGrid`를 유지해 E2E(`반대:` 3, 배지, 합의점)를 깨지 않는다.

토론이 시작되면 회의실 장면을 낮추고 결과 카드를 위에 둔다. 사회자 메모 폼은 홈에서 빼고 의사결정으로 옮겼다.

## 검증

- 단위: `glanceLine`·`glanceNote`·`forestNavActive`·`parseRecentSessions`·`cellsForRound`
- E2E: 안건/유형 y < 업로드, 메뉴 클릭, `/decision?id=uE7m2G` 압축 뷰. 유효 안건으로 토론 시작은 누르지 않음
- 배포 HTTPS만. localhost 대체 없음
- 2026-08-29 프로덕션 `https://boardroom-six-delta.vercel.app` — `pnpm test` 66, `pnpm test:e2e` **18 passed**
