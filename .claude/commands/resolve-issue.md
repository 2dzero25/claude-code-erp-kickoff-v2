---
description: GitHub issue 를 끝까지 해결 (branch + implement + PR + cr-fix loop)
argument-hint: <issue-number>
---

# /resolve-issue <n>

지정된 issue 를 branch → implement → test → PR → 자동 review fix loop 까지 끝까지 끌고 간다.

## 사전 조건

- `gh auth status` 통과
- working tree 가 깨끗 — 안 그러면 사용자에게 stash / commit 먼저 하라고 안내 후 중단
- 인자로 issue 번호가 들어옴 (`$ARGUMENTS`)

## 흐름

### 1. Issue 파악

```bash
gh issue view $ISSUE_NUMBER --json title,body,labels
```

- `body` 안에 `<!-- TDD: enabled -->` marker 있으면 TDD 흐름 (Red-Green-Refactor)
- 없으면 일반 구현

### 2. Branch 생성

default branch 에서 새 branch 생성:

```bash
DEFAULT=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git checkout "$DEFAULT" && git pull --ff-only
git checkout -b "feat/$ISSUE_NUMBER-<slug>"
```

`<slug>` = issue title 을 lowercase + 공백을 `-` 로 + 특수문자 제거 + 50자 cap.

### 3. 구현 계획

implement 전에 짧은 plan 출력:
- 어떤 파일을 건드릴지
- 어떤 테스트로 검증할지
- 위험 요소

사용자 승인 후 진행.

### 4. 구현

- **TDD 흐름** (marker 있음):
  1. RED: 실패하는 테스트가 이미 있음을 확인 (해당 프로젝트의 테스트 명령)
  2. GREEN: 최소 구현으로 통과
  3. REFACTOR: 중복 제거, 가독성 개선 (테스트 유지)
- **일반 흐름** (marker 없음): 직접 구현

구현 중 따르는 규칙은 `@CLAUDE.md` 및 그가 참조하는 문서들 (`docs/rules/*`, `.claude/spec/*` 등 프로젝트마다 다름) 에서 가져온다.

### 5. 검증

해당 프로젝트의 테스트 / 린트 명령 (e.g. `npm test && npm run lint`, `pytest && ruff check .`, `cargo test && cargo clippy`) 을 실행해서 모두 통과해야 다음 단계. 실패하면 멈추고 원인 분석 후 사용자에게 보고.

### 6. Commit + PR

- 변경 파일만 staging — `git add -A` 금지
  ```bash
  git status --short  # 의도한 파일만 있는지 확인
  git add <intended-files>
  ```
- conventional commit message
  ```bash
  git commit -m "feat: <issue title>"
  ```
- push + PR
  ```bash
  git push -u origin HEAD
  gh pr create --fill --body "Closes #$ISSUE_NUMBER"
  ```

### 7. `/cr-fix` 자동 호출

PR 생성 직후 자동으로 `/cr-fix` 를 inline 으로 호출한다. 사용자가 별도 명령 입력 불필요. `.claude/commands/cr-fix.md` 의 흐름을 그대로 실행:

1. `Claude Code Review` check run 시작 polling
2. 결과 fetch (inline + check run details)
3. 사용자 검토 (Apply / Skip)
4. apply → commit → push (review 트리거 "After every push" 면 자동 재리뷰)
5. convergence 또는 max iteration

### 8. 마무리

- issue body 의 checkbox 중 완료된 항목 체크
  ```bash
  gh issue edit $ISSUE_NUMBER --body "<updated body>"
  ```
- PR URL 보고
- merge 는 사용자가 직접 (auto-merge 안 함)

## 출력 형식

- Step 3 후: plan bullet 5개 (변경 파일 / 흐름 / 테스트 / 위험 / 질문)
- Step 7 후: PR URL + cr-fix 진행 보고
- Step 8 후: 최종 PR URL + "merge 는 직접 진행"

## 금지

- working tree dirty 상태에서 branch 생성하지 않는다
- `git add -A` / `git add .` 금지
- npm test 또는 lint 실패 상태에서 PR 만들지 않는다
- merge 자동 수행하지 않는다 (사용자 직접)
- 새 npm 패키지 설치는 사용자에게 먼저 묻는다
