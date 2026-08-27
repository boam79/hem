# 2026-08-28 클론·조건부 install 증거

목표 문구: Cloud Agent가 클론하고 조건부 install 하도록 증거한다.
`.cursor/environment.json` install:

```
if [ -f package.json ]; then corepack enable && pnpm install --frozen-lockfile=false; fi
```

## 1. GitHub에 doc/ 존재

`GET https://api.github.com/repos/boam79/hem/contents/doc?ref=main` 이 파일 목록을 반환함 (200).
보이는 항목: README.md, cloud-mobile-setup.md, infra-notes.md, mcp-status.md, prd-review.md, prd/, progress/, scratchpad.md.

`origin/main` SHA = 로컬 HEAD = `84578d1`.

## 2. 빈 디렉터리에 git clone 후 동일 스크립트

```
git clone --depth 1 git@github.com:boam79/hem.git
HEAD: 84578d1
package.json: 없음
install_exit: 0
doc/: README.md cloud-mobile-setup.md infra-notes.md mcp-status.md prd prd-review.md progress scratchpad.md
```

로컬 워크트리에서 같은 한 줄도 `install_exit:0`.

이 항목은 **GitHub에서 클론 + 스크립트 no-op** 증거다. Cursor Cloud VM에서 돌았다는 증거는 아니다.

## 3. Cursor Cloud Agent — 완료

Linux Cloud VM(`hostname: cursor`)에서 동일 스크립트를 돌렸다. 증거 커밋: https://github.com/boam79/hem/commit/44812fdf1a446adca50fac6bfa69f51f632b7081

- 브랜치: `cursor/cloud-clone-evidence-e3d8`
- 커밋: `44812fd`
- hostname: `cursor`
- uname: `Linux cursor 6.12.94+ ... x86_64`
- 클론 SHA: `8134cb5`
- install exit: `0`
- 원문: [2026-08-28-cloud-clone-evidence.md](2026-08-28-cloud-clone-evidence.md)

P0-5 닫음. Cloud가 GitHub `boam79/hem`을 읽었다는 것은 Cursor↔GitHub 연결이 이 리포에 대해 동작한다는 뜻이다.

## 4. 남은 사람 확인

- 모바일 앱에서 목록 새로고침 후 `hem`이 보이는지 (연결은 Cloud 클론으로 이미 확인)
- Docker 이미지 빌드: 이 맥에 `docker` 없음. Cloud Dockerfile은 에이전트가 빌드한다.
