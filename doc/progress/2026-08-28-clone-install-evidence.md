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

## 3. Cursor Cloud Agent

같은 검증을 Cloud VM에서 돌리기 위해 에이전트를 `main` 기준으로 실행함.

- ID: `bc-6d1df64c-752f-4e04-b1e1-e6de202ce3d8`
- 요청: SHA·install exit 0·`doc/progress/2026-08-28-cloud-clone-evidence.md` 커밋

완료되면 이 파일에 Cloud 쪽 SHA와 브랜치를 추가한다. 끝나기 전에는 P0-5를 닫지 않는다.

## 4. 아직 아닌 것

- Docker 이미지 빌드: 이 머신에 `docker` 바이너리 없음.
- P0-4: Cursor 계정 GitHub App으로 `boam79/hem`이 보이는지(모바일 목록)는 사람 확인.
