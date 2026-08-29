# 2026-08-29 홈 말풍선 · 토론 결과 메뉴

잘못된 UI는 토론이 시작되면 회의실을 접고 R1·R2 카드를 위에 올리는 홈이었다. compact CSS가 `.speech-bubble { display: none }`이라 동물 캐릭터 앞 말풍선이 사라졌다. 목표 시안(`doc/design/02.png`)은 업로드 패널 + 회의실 말풍선이고, 카드는 홈에 없다.

## 이번에 한 일

- 홈에서 `DebateGlance`와 `is-compact`를 제거. 회의실은 항상 전체 크기. 각 페르소나 말풍선(`data-bubble`)에 업로드 카피 → 스트림 `position` → R1/R2 한 줄.
- JSON 스트림은 원문 `{`를 말풍선에 넣지 않는다. `spokenFromStream`이 `"position"`만 꺼낸다.
- 사이드바 **토론 결과** 메뉴 → `/debate`. 최근 세션·`?id=`·데모 `w4demo`. R1·R2 카드와 `/s/[id]`·사회자 메모 링크.
- 홈 워크스페이스를 02처럼 왼쪽 업로드 패널 / 오른쪽 회의실 2열로 옮김. 사이드바는 로고+메뉴만.

## 검증 (코드)

- 단위 `pnpm test` 81. `spokenFromStream`·`forestNavActive("/debate")`.
- `pnpm build` 통과. `/debate` 정적 라우트.
- 유효 안건으로 토론 시작은 E2E에서 누르지 않음.

## HTTPS E2E

배포 후 `pnpm test:e2e` (baseURL `https://boardroom-six-delta.vercel.app`). 홈 말풍선 3개, 홈에 glance 카드 없음, 메뉴 토론 결과, `/debate?id=w4demo` glance.
