---
description: PR 머지 후 로컬 branch 정리 + CLAUDE.md stale 감지 + 갱신 제안
argument-hint: <pr-number>
---

# /post-merge

지정된 PR 이 머지된 직후 실행한다. (a) 로컬 branch 정리, (b) PR diff + CLAUDE.md 의 모든 주장에 대한 전수 stale 감지, (c) diff-style 제안 → 사용자 컨펌 → apply.

## 사전 조건

- `gh auth status` 통과
- main repo 안에서 실행 (worktree 안에서는 §1 의 guard 가 차단)
- 인자로 PR 번호가 들어옴 (`$ARGUMENTS`). 없으면 흐름 §1 에서 사용자가 선택

## 흐름

### 1. PR 식별

```bash
PR_NUM="$ARGUMENTS"

if [ -z "$PR_NUM" ]; then
  gh pr list --state merged --limit 5
  # 사용자가 번호 선택
fi

gh pr view "$PR_NUM" --json state,baseRefName,headRefName,body,files,title
```

`state` 가 `MERGED` 가 아니면 중단. 이 `gh pr view` 결과를 **머지 신호의 단일 출처**로 본다 — SHA 비교 (`git log base..branch`, `git cherry`, `git rev-list --left-right`) 는 squash / rebase merge 에서 false positive 를 내므로 사용하지 않는다.

### 2. Branch 정리

#### 2a. Worktree guard

```bash
if [ "$(git rev-parse --git-dir)" != "$(git rev-parse --git-common-dir)" ]; then
  MAIN_REPO=$(cd "$(git rev-parse --git-common-dir)/.." && pwd -P)
  echo "[abort] post-merge 는 worktree 안에서 실행하지 않는다."
  echo "main repo 에서 다시 실행: $MAIN_REPO"
  exit 1
fi
```

#### 2b. Dirty tree 처리

```bash
git status --porcelain
```

modified / staged 가 있으면 `AskUserQuestion` 으로:
- stash: `git stash push -m "post-merge: temp save"`
- discard: `git checkout -- . && git clean -fd`
- abort: 사용자가 직접 해결하라고 안내 후 중단

untracked (`??`) 는 무시.

#### 2c. Base 전환

```bash
git fetch origin
git checkout "$baseRefName"
git pull --ff-only origin "$baseRefName"
```

#### 2d. Local branch 삭제

```bash
git branch --list "$headRefName"
```

존재하면 사용자 컨펌 후:

```bash
git branch -d "$headRefName"
```

`warning: not yet merged to HEAD` 는 squash merge 의 정상 동작. `-D` 로 escalate 하지 않는다. `gh pr view` 의 `state=MERGED` 가 이미 머지를 보증한다.

### 3. 변경 후보 수집

#### 3a. PR diff hint

```bash
gh pr diff "$PR_NUM" --name-only
gh pr view "$PR_NUM" --json body --jq '.body'
```

학습 종류:
- 새 파일 / 명령 / 규칙 → 추가 후보
- 이름 변경 / 경로 이동 → 수정 후보
- 삭제된 파일 / 기능 → stale 후보

#### 3b. CLAUDE.md 전수 stale 감지

PR 과 무관하게 CLAUDE.md 의 모든 주장을 현재 저장소 상태와 대조.

| 주장 종류 | 검증 | stale 판정 |
|---|---|---|
| 파일 경로 인용 (`docs/...`, `src/...`, `REVIEW.md`) | `Glob` 또는 파일 존재 확인 | 존재 안 함 |
| `@` import (`@docs/rules/*.md`) | `Read` 가능 여부 | 읽기 실패 |
| npm 명령 (`npm test`, `npm run lint`, ...) | `package.json` scripts 와 대조 | script 정의 없음 |
| TODO 진척도 (`채워야 할 TODO 두 군데` 등) | 해당 파일에 placeholder/throw 가 남아있는지 grep | 이미 채워짐 |
| 슬래시 명령 (`/create-issue`, `/resolve-issue`) | `.claude/commands/*.md` 존재 확인 | 명령 정의 없음 |

자동 제거하지 않는다. 사용자에게 보고만 하고 §4 에서 컨펌 받는다.

#### 3c. 분류

§3a 와 §3b 의 결과를 합쳐 3 buckets:
- `+` 추가: PR 이 도입했고 CLAUDE.md 에 아직 없는 항목
- `~` 수정: PR 이 이름/경로 바꿨고 CLAUDE.md 의 인용도 바꿔야 함
- `-` stale: PR 이 제거했거나, §3b 전수 검증으로 안 맞는 줄

### 4. 변경 제안 + 사용자 컨펌

diff-style 요약 출력 예시:

```
CLAUDE.md 갱신 제안 (PR #N — <title>):

  + 추가 (PR 도입)
    - "## 검증" 섹션: `npm run typecheck` 추가

  ~ 수정 (PR 변경)
    - line 27: "docs/lab-prompts/00-setup.md" → "docs/lab-prompts/00-setup-v2.md"

  - stale (현재 저장소 상태 불일치)
    - line 44-45: "채워야 할 TODO 두 군데"
      이유: DiscountPolicy.ts 와 ApproveOrderUseCase.ts 둘 다 placeholder 없음
    - line 31: REVIEW.md 인용
      이유: 파일이 저장소에 존재하지 않음

  변경 후보 0 건이면: "갱신 후보 없음. CLAUDE.md 그대로 유지."
```

`AskUserQuestion`:
- **자동 적용**: 모든 항목 apply
- **항목별 선택**: 항목마다 apply / skip 결정
- **중단**: 아무것도 적용 안 하고 종료

### 4.5. Pre-apply 자기검증 (No Stamps)

apply 직전, 추가/수정될 모든 줄을 self-check:

- `(#N)`, `PR #N`, `Issue #N`, `이슈 #N` 같은 inline 인용 금지
- `## Post-Merge`, `## 2026-XX-XX` 같은 changelog 헤더 금지
- "Added in PR" / "Fixed in PR" / "Introduced in PR" 같은 historical 표현 금지
- current-state tone (`X 는 async 이다`) 만 사용

위 패턴이 하나라도 검출되면 apply 중단 → 해당 줄을 재작성한 뒤 사용자에게 다시 보여준다.

### 5. (Optional) Commit

CLAUDE.md 가 실제로 수정됐으면 사용자 컨펌 후:

```bash
git add CLAUDE.md
git commit -m "docs(claude): sync CLAUDE.md with PR #$PR_NUM + sweep stale references"
```

push 는 하지 않는다. 사용자가 직접.

### 6. (Optional) Stash 복원

§2b 에서 stash 했다면 마지막에 복원 옵션 제공:
- `git stash pop` — 복원 + 제거
- `git stash apply` — 복원 + 유지
- 나중에 — 사용자 수동 처리

## 종료 조건

| final_state | 의미 |
|---|---|
| `clean` | §3 결과 변경 후보 0 건. CLAUDE.md 손 안 댐. |
| `applied` | 사용자가 변경을 apply 함. CLAUDE.md 수정됨. |
| `branch_only` | PR 이 doc 무관 (예: 테스트만 추가) — branch 정리만 하고 doc 단계 skip. |
| `user_aborted` | 사용자가 §4 에서 중단 선택. |
| `worktree_blocked` | §2a worktree guard 에서 중단. main repo 재실행 필요. |

## 금지

- PR/Issue 번호 stamp 금지: `(#N)`, `PR #N`, `Issue #N`, `이슈 #N` 같은 인용을 CLAUDE.md 본문에 박지 않는다. commit message 와 PR body 에만 허용.
- `## Post-Merge`, `## YYYY-MM-DD Updates` 같은 changelog 헤더 금지 — 모든 갱신은 기존 섹션에 in-place 통합
- "Added in PR" / "Fixed in PR" 같은 historical narrative 금지 — current-state tone 만
- 추측 적용 금지 — `Glob` / `Read` / `package.json` 대조로 확인 안 된 stale 후보는 보고만 하고 자동 제거하지 않는다
- `git branch -D` 금지 — squash merge 의 `not yet merged to HEAD` 경고는 정상
- `git push` 금지 — commit 까지만, push 는 사용자가 직접
- 새 normative 파일 (`AGENTS.md`, `GEMINI.md`, `post_merge_prN.md` 등) 자동 생성 금지

## Reference

- `CLAUDE.md` — 갱신 대상
- `.claude/commands/cr-fix.md` — 본 저장소 명령 패턴
