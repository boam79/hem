# 2026-08-29 엑셀·CSV 지표 업로드

배포: https://boardroom-six-delta.vercel.app  
GitHub: https://github.com/boam79/hem

## 기능

- 홈에서 `.csv` / `.xlsx` 업로드 → `POST /api/metrics/parse` → 세션 `metrics` jsonb에 저장
- 라운드는 업로드 지표가 있으면 그걸 쓰고, 없으면 `data/metrics.json`
- 월별 환자통계(수술·유입) + 재무흐름(`cash_in`/`cash_out`/`cash_net`, 만원)

## 더미

- `/dummy/patient-and-cashflow.csv`
- `/dummy/patient-and-cashflow.xlsx`
- 병원명 `업로드안과(가상)`, 2025-08 라식 **99** (기본 합성 210과 구분)

## 검증

- `pnpm test` 53 passed (csv/xlsx 왕복, 토큰 ≤1000)
- `pnpm build` 통과
- HTTPS parse CSV·xlsx 200, 병원 `업로드안과(가상)`, 라식 99, cashflow 있음
- 실토론 세션 **`dohUks`**: R1 ok=3, R2 ok=3, GET metrics.hospital.name = 업로드안과(가상)
  https://boardroom-six-delta.vercel.app/s/dohUks
