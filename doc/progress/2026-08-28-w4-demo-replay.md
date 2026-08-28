# 2026-08-28 W4 데모 재생

## 한 일

- 홈에 연결 상태(`/api/health`) 배너, 상단 내비(데모 공유·발표 슬라이드), **데모 재생** 버튼을 붙였다.
- 키·DB가 없어도 셀 skeleton → R1 → R2 objection → 사회자 메모가 홈에서 이어진다. 실모델 호출이 아님을 고지한다.
- 90초 스크립트를 데모 재생 경로에 맞췄다.

## 확인

- 단위 테스트: health 게이트, demoCells 매핑 추가.
- 실토론 AC(F3 30초 실호출)는 여전히 키·Supabase 대기.

## 배포 후

- 프리뷰 HTTPS: `https://boardroom-non01jcuk-ckadltmfxhrxhrxhr-5008s-projects.vercel.app`
- Playwright 6/6 통과. baseURL은 위 프리뷰(localhost 아님).
- 홈에서 데모 재생 → Anthropic/OpenAI/Google 배지 3개, R2 `반대:` 3개, 사회자 메모.
