# Cursor Cloud · 모바일 착수

모바일 Cursor는 IDE가 아니다. Cloud Agent를 고르고 PR을 검토하는 화면이다.
요구: iOS 26+ / iPadOS 26+, Cloud Agents가 있는 유료 플랜. Android 없음.

## 리포 (Executor)

- [x] `AGENTS.md`에 `Cursor Cloud specific instructions`
- [x] `.cursor/environment.json` + `.cursor/Dockerfile` (Node 20, 조건부 pnpm)
- [x] GitHub `boam79/hem`에 푸시 (P0-3)
- [x] Cloud Agent 클론·install (P0-5, `44812fd`, exit 0)

`install`은 `package.json`이 없으면 아무것도 하지 않고 성공한다.

## 사람 (대시보드 · 폰)

시크릿·GitHub 연결은 폰에서 못한다. [cursor.com/dashboard](https://cursor.com/dashboard)

1. GitHub 연결은 Cloud 클론으로 확인됨. 폰 앱은 목록을 당겨 새로고침.
2. Cloud Secrets: `.env.example`과 같은 이름. 이어서 할 작업은 **`doc/progress/2026-08-28-mobile-handoff.md`**.
3. App Store에서 Cursor 설치, 같은 계정
4. 웹 [cursor.com/agents](https://cursor.com/agents)에서도 동일 리포가 보여야 한다

## Remote Control (선택)

데스크톱이 켜져 있을 때만. Cursor 3.9.8+, Settings > Agents에서 Remote Control, `/remote-control`.
폰에서 로컬 파일을 만지려면 컴퓨터가 깨어 있어야 한다. 컴퓨터 없이 개발하려면 Cloud Agent가 맞다.
