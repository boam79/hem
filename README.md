# Boardroom (hem)

병원의 집계 경영 지표와 안건을 넣으면, Anthropic·OpenAI·Google 경량 모델 3개가 재무이사·마케팅실장·진료원장으로 2라운드 토론하고, 사람 사회자가 비교 그리드를 보며 메모를 공유하는 웹앱.

- 대회: 원티드 AI Championship 2026
- 원격: https://github.com/boam79/hem
- 제품 정의: [doc/prd/PRD_v1.0.md](doc/prd/PRD_v1.0.md)
- 진행 기록: [doc/README.md](doc/README.md)

## 로컬

앱 코드가 생긴 뒤:

```bash
pnpm install
pnpm test
pnpm dev
```

시크릿은 `.env` (커밋 금지). 이름은 `.env.example` 참고. Supabase 키가 없으면 API는 503을 반환한다.

## Cursor Cloud · 모바일

모바일 앱은 로컬 에디터가 아니라 Cloud Agent 조종 화면이다. 이 리포가 GitHub에 있고 Cursor 계정에 GitHub가 연결되어 있어야 한다.

1. Cursor 대시보드에서 GitHub App으로 `boam79/hem` 허용
2. Cloud Secrets에 API 키 등록 (W1 이후)
3. iOS Cursor 앱에서 같은 계정으로 이 리포를 고른다

환경은 `.cursor/environment.json` + `.cursor/Dockerfile` (Node 20, 조건부 `pnpm install`).

## E2E

기능 검증·스모크는 배포된 HTTPS URL에서만 한다. localhost로 대체하지 않는다.
