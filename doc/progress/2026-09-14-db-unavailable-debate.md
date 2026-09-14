# 2026-09-14 토론 시작 실패 · TypeError fetch failed

홈에서 파일을 올리고 「토론 시작」을 눌러도 업로드 완료 말풍선만 남았다. 회의록·시나리오 결과·AI 인사이트는 빨간 `TypeError: fetch failed`.

## 원인

Supabase 프로젝트 `boardroom` (`tbtjdfayqgcdywybczjr`)이 Free 일시 중지(`INACTIVE`)였다. `/api/health`의 `supabase: true`는 환경 변수만 보고, 실제 ping은 하지 않았다. 세션 POST·GET이 모두 실패해서 발언이 저장되지 않았다.

## 한 일

- MCP로 프로젝트 restore. 상태 `ACTIVE_HEALTHY`.
- DB 네트워크 오류를 `db_unavailable` 한글 메시지로. 홈 오류는 「토론 시작」바로 아래.
- 회의록·시나리오·인사이트에 데모 링크. health는 `sessions` ping.
- 안건 여러 줄을 항목별로 표 숫자와 연결하라는 프롬프트. 홈 말풍선에 첫 evidence.

## 검증

- 단위 139.
- 복구 직후 HTTPS `GET /api/session?id=uE7m2G` 200. `_8iSsX`는 일시 중지 중 저장 실패라 `not_found`.
- 실토론 클릭은 배포 후 사용자가 「토론 시작」한 번.

## 하지 않은 것

- 유형을 가중치로 넣는 일.
