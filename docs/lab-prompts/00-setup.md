# Setup — gh CLI + Claude Code Review

lab 시작 전 한 번만 한다. 이 문서를 Claude 에게 통째로 넘기면 OS 감지부터 활성화까지 차례로 도와준다.

> **진행 규칙**
>
> - Claude 는 무조건 설치/실행부터 하지 않는다. 각 단계마다 먼저 `--version` 등으로 상태를 확인하고, 이미 되어 있으면 건너뛴다.
> - `[사용자]` 표시가 붙은 단계는 Claude 가 멈추고 사용자에게 넘긴다 (브라우저 인증, TUI 슬래시 커맨드, 웹 UI 클릭 등 사람이 직접 해야 하는 작업).
> - 표시 없는 단계는 Claude 가 직접 실행해도 된다. 단, 새 설치나 환경 변경은 실행 전에 짧게 알린다.

## 1. gh CLI

GitHub CLI 가 없으면 issue 생성 / PR 자동화가 안 된다. 설치 + 인증.

### 설치 확인

```bash
gh --version
```

버전이 나오면 다음 단계로. 없으면 OS 별 설치:

| OS | 명령 |
|---|---|
| Windows | `winget install GitHub.cli` (없으면 `scoop install gh`) |
| macOS | `brew install gh` |
| Ubuntu / Debian | `sudo apt install gh` |
| Fedora / RHEL | `sudo dnf install gh` |

### 인증

> **[사용자]** 브라우저 device flow 라 사람이 직접 코드를 입력해야 한다. Claude 는 명령만 안내하고 멈춘다.

```bash
gh auth login
```

`GitHub.com` → `HTTPS` → 브라우저 인증 흐름 권장. 인증 후 확인:

```bash
gh auth status
```

## 2. Claude Code Review 활성화

학생의 구독 / 인증 상황에 따라 두 경로 중 하나.

### 경로 A — Anthropic Pro / Max 구독 (또는 API key)

> **[사용자]** 이 절 전체는 사람이 Claude Code TUI 안에서 직접 한다. 보조 Claude (이 문서를 읽고 있는 에이전트) 는 슬래시 커맨드를 호출하지 못한다. 명령만 안내하고 멈춘다.

저장소 안에서 Claude Code 실행:

```bash
claude
```

세션 안에서:

```
/install-github-app
```

두 옵션 다 체크:
- `@Claude Code` — issue / PR 코멘트에서 `@claude` 멘션 가능
- `Claude Code Review` — PR 자동 리뷰

인증 흐름 (Pro / Max 또는 API key) 따라가면 `.github/workflows/claude.yml` 과 secret 이 자동 등록된다.

### 경로 B — Team / Enterprise 구독

> **[사용자]** 웹 UI 클릭 흐름. 사람이 직접 한다.

[claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code) → `Code Review` 섹션 → GitHub App 설치 → 본 저장소 선택.

> Team / Enterprise 의 managed Code Review 는 토큰 비용이 별도 청구된다 (평균 $15-25 / review). 비용 부담이 적은 Pro / Max 경로 (A) 를 먼저 권한다.

## 3. 트리거 모드 — "After every push" 권장

> **[사용자]** §2 활성화 직후 뜨는 화면에서 사람이 선택한다.

활성화 직후 트리거 모드 선택 화면이 뜬다. 다음 중 선택:

| 모드 | 동작 | 비용 | lab 권장 |
|---|---|---|---|
| Once after PR creation | PR 열릴 때 1회 | 가장 낮음 | 학습용 1회 시도 |
| **After every push** | 매 push 마다 자동 | 매 push 마다 | **○ (cr-fix loop 자동화)** |
| Manual | `@claude review` 댓글로만 | 옵트인 시점만 | 비추 |

`After every push` 로 설정해야 `/resolve-issue` 안의 cr-fix loop 가 push 만 하면 자동 재리뷰 받는다.

## 4. REVIEW.md 확인

이 저장소는 root 에 `REVIEW.md` 가 박혀 있다. Code Review 가 모든 에이전트의 system prompt 에 최우선으로 주입한다. 한국어 응답 + Clean Architecture / TDD 기준이 설정되어 있다.

저장소 자기 도메인에 맞게 다듬고 싶으면 `REVIEW.md` 를 직접 수정. 길게 늘리지는 않는다 — 짧고 구체적인 규칙이 더 잘 먹는다.

## 5. 동작 확인

테스트 PR 한 번:

```bash
git checkout -b test/setup-check
echo "// noop" > test-noop.ts
git add test-noop.ts && git commit -m "test: setup check"
git push -u origin HEAD
gh pr create --fill
```

1-2 분 안에 `Claude Code Review` check run 이 자동으로 시작되면 정상. 끝나면 `gh pr checks` 로 결과 확인. 한국어로 review 가 달려있어야 함.

확인 끝나면 test PR 닫고 branch 삭제:

```bash
gh pr close --delete-branch
```

## 6. (lab 3 진입 전) superpowers plugin 설치

lab 3 (`docs/lab-prompts/03-superpowers-cycle.md`) 부터는 superpowers plugin 의 슬래시 명령 (`/brainstorming`, `/writing-plans` 등) 을 쓴다. lab 1-2 만 할 거면 이 절은 건너뛰어도 된다.

### 활성화 확인

Claude Code 세션 안에서 사용 가능한 skill 목록에 `superpowers:brainstorming`, `superpowers:writing-plans` 같은 namespace 항목이 보이면 이미 설치된 상태 — §7 로 넘어간다.

### 설치

> **[사용자]** Claude Code TUI 세션 안에서 직접 실행. 보조 Claude (이 문서를 읽고 있는 에이전트) 는 슬래시 커맨드를 호출하지 못한다.

```
/plugin install superpowers@claude-plugins-official
```

`claude-plugins-official` marketplace 가 등록돼 있어야 한다. 등록 안 돼 있으면 먼저 marketplace 추가가 필요 — [공식 문서](https://code.claude.com/docs/en/plugins) 참고.

설치 후 새 세션에서 `superpowers:` 항목이 노출되는지 다시 확인.

## 7. 다음 단계

setup 끝났으면:

- `docs/lab-prompts/01-create-issues.md` — TODO 두 개를 GitHub issue 로 등록
- `docs/lab-prompts/02-resolve-issue.md` — issue 하나씩 implement + review + fix
- `docs/lab-prompts/03-superpowers-cycle.md` — design/spec 시드 → plan → SDD → PR → cr-fix → post-merge 한 사이클
