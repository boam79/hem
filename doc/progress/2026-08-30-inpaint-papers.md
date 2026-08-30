# 2026-08-30 서류를 원본 회의실에 인페인트

## 10단계

1. 바인더가 맞는 이유: `forest-room.png`와 같이 그려져 조명·원근·점토가 같다.
2. 중앙 서류가 안 맞는 이유: 다른 카메라의 흰 아이소메트릭 PNG다.
3. 그 PNG를 나무 위에 합성해도(bake1) 후광·스티커가 남는다.
4. CSS 필터·세피아·크기 조절은 스티커를 남긴다.
5. 해결: 원본 회의실을 유지한 채 빈 나무에만 점토 서류를 그린다.
6. 대기는 `forest-room-idle.png` — 크림 4~5장, 윗장만 민트 그리드.
7. 업로드·토론은 `forest-room-stacked.png` — 같은 점토로 높은 산.
8. 접촉은 바인더처럼 나무색 그림자. 흰 글로우·노란 방사광 없음.
9. CSS 오버레이 서류 PNG는 그리지 않는다. 스파클·대기 문구만.
10. HTTPS에서 대기 홈과 업로드 후 홈을 확인한다.

## 이번에 한 일

- `forest-room-idle.png` / `forest-room-stacked.png`를 원본 인페인트로 교체.
- 캐시 `?v=inpaint1`.
- 실토론 버튼은 누르지 않는다.

## 검증

- 단위 `pnpm test`
- HTTPS https://boardroom-six-delta.vercel.app
