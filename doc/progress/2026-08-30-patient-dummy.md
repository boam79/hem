# 2026-08-30 전 진료과 환자 더미 (400KB 이하)

배포 후 확인: https://boardroom-six-delta.vercel.app/files  
GitHub: https://github.com/boam79/hem

## 요청

업로드 한도(400KB) 안에서 전 진료과·성별·나이대·지역이 들어간 더미로 업로드 테스트.

## 파일

- `/dummy/hospital-patients-full.csv` — **월별 집계** (`month` 헤더). 지금 프로덕션 파서가 받는 형식
- `/dummy/hospital-patients-full.xlsx` — `monthly` 시트 + `patients` 시트(진료과·성별·나이·지역)
- `/dummy/hospital-patients-visits.csv` — 약 370KB 방문행. 환자행 파서 배포 후에만 업로드
- 기존 `/dummy/patient-and-cashflow.*` 는 E2E(라식 99)용으로 유지

지금 사이트는 `month,lasik,...` 만 읽는다. 방문행 CSV를 올리면 `month 헤더 행이 없습니다` 가 난다.

진료과 27개(의료법 진료과목) + 안과 시술 13종. 성별 남/여, 나이대 9단, 광역 17, 국적·유입 4종. 기간 2025-08~2026-07.

재생성: `node scripts/write-dummy-patients.mjs`

## 파서

환자행은 월 12개로 합쳐 기존 토론 스키마(라식·스마일·ICL·백내장·현금흐름)에 넣는다. 인구통계 한 줄은 토큰 1,000 이내면 지표 표에 붙인다. 월별 CSV의 알 수 없는 열은 무시한다.

## 검증

- `pnpm test` 98 passed
- 로컬에서 전체 더미 parse → 병원명 `포레스트병원(가상)`, 12개월
- HTTPS 업로드는 파서 배포 뒤에 `/files`에서 「환자통계 CSV」로 확인. 토론 시작은 누르지 않음
