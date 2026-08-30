# 2026-08-30 Executor: 업로드 통계 + 홈 데이터 검토

메뉴는 늘리지 않았다. 사이드바는 홈 · 토론 결과 · 대시보드 · 파일 관리 · 의사결정 · 설정.

## 한 일

- `/files` 업로드 성공 후 `#upload-stats`: 병원명, 기간, 의사 수, 수술 합, 순현금, 12개월 표. **올린 파일만.** 기본 `S안과` 합성 지표는 안 그림.
- 홈 「데이터 검토」: 업로드 없으면 disabled. 누르면 고정 안건 `업로드한 12개월 지표에서 위험·가정·필요 데이터를 올려라` + 올린 metrics로 기존 세션·라운드. 「토론 시작」은 안건 10~200자 유지.
- E2E는 「데이터 검토」「토론 시작」을 **누르지 않음.** 노출·disabled·업로드 후 enabled만.

## 검증

- 단위 104
- `pnpm build` 통과
- HTTPS E2E **27 passed** (`https://boardroom-six-delta.vercel.app`)
- 브라우저: 프로덕션 홈에 「데이터 검토」 보임, 업로드 전 disabled. 업로드 후 표·버튼 enabled는 Playwright 스모크(더미 CSV).

## 배포

- https://boardroom-six-delta.vercel.app
- `cbf0b12` 기능, `2956532` E2E 로케이터(병원명 중복)

## 쓰지 말 것

Finder에 남은 **방문행** `hospital-patients-visits.csv`만 올리면 예전 파서에서는 실패했다. 지금은 환자행 파서가 배포됨. 월별 헤더는 `hospital-patients-full.csv` / `.xlsx`. E2E 더미는 `patient-and-cashflow.csv`.

Planner 완료는 사용자 확인 후. 「데이터 검토」 실클릭은 LLM 비용.
