# 2026-09-14 Executor: R4 합의점 E2E

# 2026-09-14 Executor: R4 합의점 E2E

시나리오 결과에 저장된 제목 `합의점`과 입력 칸 `1. 합의점`이 같이 있으면 Playwright `getByText("합의점")`가 둘 다 잡아 strict 실패. 실세션 `uE7m2G` GET은 지금 500(`TypeError: fetch failed`)이라 그 URL로는 검사가 막힌다.

## 한 일

- 저장된 제목에 `data-memo=view-consensus`, 입력 칸에 `data-memo=form-consensus`.
- 시나리오 결과 스모크는 데모 `w4demo`(JSON, DB 없음). 저장 버튼은 없음. HTTPS 해당 테스트 통과.
- 공유 페이지 `합의점`은 `exact: true`. HTTPS 통과.

## 검증

- HTTPS Playwright 해당 테스트. 실 LLM 버튼 없음.
- `uE7m2G` 500은 R4 밖. 다음 턴에서 DB/keepalive 확인.
