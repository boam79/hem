# 인프라 실측 (2026-08-28)

PRD 가정과 MCP로 본 계정 상태를 맞춰 둔다. 시크릿 값은 적지 않는다.

## GitHub

- 원격: https://github.com/boam79/hem
- 빈 리포 (refs 없음). 첫 푸시가 초기화다.
- 이 세션 `gh`는 미로그인. `git ls-remote` HTTPS는 성공(공개 빈 리포 또는 자격 증명 캐시).

## Vercel (Hobby)

- 팀: `ckadltmfxhrxhrxhr-5008s-projects` / `team_U7AuO5lMD3rtoAwkrj410jpx`
- hem 프로젝트 없음. W1-1 이후 GitHub 연결로 생성.
- 비상업 조항: 해커톤 데모 OK, 정식 서비스 시 Pro.

## Supabase (Free)

활성 2/2:

| 이름 | ref | 상태 |
|---|---|---|
| qr-asset-manager | hiwspxrnkuvqkujvwjro | ACTIVE_HEALTHY, ap-northeast-2 |
| boam79_patient_data | bkmzuabmkbtxtetuzyaq | ACTIVE_HEALTHY, ap-northeast-2 |
| policyfund-ai-v2 | hwqsxarzgodpsvwahzae | INACTIVE |

W1-4에서 Boardroom DB를 만들 때 **활성 한도를 먼저 확인**한다. 기존 병원 데이터 프로젝트(`boam79_patient_data`)를 재사용하지 않는다 — 합성 데이터 + RLS 없음 전제와 섞이면 안 된다.

## Render

워크스페이스 `boam`. hem 서비스 없음. 사용하지 않는다.
