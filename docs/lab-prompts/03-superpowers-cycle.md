# Task 3 — design/spec → plan → SDD → PR → merge 한 사이클

Task 2 까지 끝나면 lab 의 기본 자산 (Order / DiscountPolicy / ApproveOrderUseCase) 이 완성된 상태. 이 단계는 그 위에 **Dashboard KPI 페이지** 를 새로 얹는 흐름을 superpowers plugin 의 슬래시 명령으로 처음부터 끝까지 끌고 간다.

출발점은 미리 작성된 시드 spec: [`docs/superpowers/specs/2026-05-12-dashboard-kpi-design.md`](../superpowers/specs/2026-05-12-dashboard-kpi-design.md)

## 사전 조건

- Task 2 완료 — `npm test` 가 두 use-case 모두 green
- superpowers plugin 설치됨 (`00-setup.md` §6 참고)
- 현재 branch 가 `main` 이고 working tree 깨끗
- 시드 spec 이 저장소 안에 존재 (clone 시점에 이미 박혀 있음)

## 흐름

### 1. 시드 spec 읽기

```bash
cat docs/superpowers/specs/2026-05-12-dashboard-kpi-design.md
```

`/dashboard` 라우트 신설 + KPI 카드 4 + 도넛 1 + `GetDashboardStatsUseCase` 의 설계 문서. 변경 파일 8 개 (신규 6, 수정 2). 이걸 그대로 따라가도 되고, 본인 취향대로 다듬어도 된다.

### 2. (Optional) brainstorming 으로 시드 다듬기

시드를 그대로 따라갈 거면 §3 으로 건너뛴다.

다듬을 거면:

```
/brainstorming
```

세션 안에서 시드 spec 의 어느 부분이 마음에 안 드는지 말한다. 예:
- "도넛 대신 막대 차트로 가고 싶어"
- "카드 4개가 많은 것 같아, 2개로 줄이면 어떤 게 의미 있을지"
- "Order 에 timestamp 추가해서 시간 기반 KPI 도 보이고 싶어 (현재 비범위)"

brainstorming 이 한 질문씩 던지며 결정을 좁혀준다. 결과는 spec 파일에 in-place 통합한다 — 별도 새 파일 만들지 않는다.

### 3. writing-plans

spec 기반 implementation plan 을 작성한다.

```
/writing-plans
```

또는 명시적으로:

```
plan 작성 — docs/superpowers/specs/2026-05-12-dashboard-kpi-design.md 기준
```

plan 은 task 단위로 분해된다. 각 task 마다 Red → Green → Refactor 사이클이 박힌다 (TDD 강제). plan 파일은 보통 `plans/` 하위에 저장된다.

### 4. /create-issue 로 이슈 등록

plan 의 핵심을 GitHub issue 로:

```
/create-issue
```

issue 본문에 spec 경로 + plan 경로를 reference 로 박는다 (`Closes #N` 키워드는 plan 안의 sub-issue 가 아닌 본 PR 머지 시).

### 5. /resolve-issue 로 구현

```
/resolve-issue <issue-number>
```

내부 흐름은 Task 2 와 동일 — branch → implement (TDD) → npm test + lint → PR. plan 이 있으니 implement 단계는 plan 의 task 를 순서대로 따라간다.

복잡한 plan 이면 `superpowers:executing-plans` 또는 `subagent-driven-development` 로 task 들을 병렬/순차 실행할 수도 있다. 본 lab 의 8 파일 변경 규모면 `/resolve-issue` 단독으로 충분.

### 6. cr-fix loop

PR 생성 직후 Claude Code Review 자동 트리거 (`After every push` 모드). cr-fix loop 가 review 결과 받아서 apply → push → 재리뷰 반복. Task 2 와 동일.

### 7. merge 와 /post-merge

review 가 수렴하면 직접 merge:

```bash
gh pr merge --squash --delete-branch
```

머지 후 branch 정리 + CLAUDE.md stale 감지:

```
/post-merge <pr-number>
```

`/post-merge` 가 자동으로:
- worktree guard 통과 확인
- base branch 전환 + pull
- local merged branch 삭제
- PR diff + CLAUDE.md 의 모든 주장을 현재 저장소와 대조해 stale 감지
- diff-style 제안 → 사용자 컨펌 → apply → commit

자세한 내부 흐름은 [`.claude/commands/post-merge.md`](../../.claude/commands/post-merge.md) 참고.

## 결과 확인

- `npm run dev` 후 브라우저 진입 → `/dashboard` 로 redirect → 4 카드 + 도넛 렌더링
- Sidebar 에 `Dashboard` 메뉴 노출 + 현재 페이지에 따라 active 분기
- `npm test` 통과 (use-case 5 케이스 추가)
- PR 머지됨 + local branch 삭제됨

## 트러블슈팅

- **brainstorming 이 너무 깊이 묻는다** → "이 spec 그대로 가고 싶어, 변경 없음" 으로 끊고 §3 으로
- **plan 이 너무 잘게 쪼개졌다** → plan 안의 task 를 묶거나 일부 합쳐서 다시 작성 — `/writing-plans` 의 자체 refine 흐름 활용
- **post-merge 의 stale 감지가 과민하게 잡는다** → 항목별 Skip 선택, 정말 stale 한 것만 apply
- **superpowers 슬래시 명령이 안 보인다** → `00-setup.md` §6 의 plugin 설치/활성화 재확인

## 한 줄 요약

```
시드 spec → /brainstorming (옵션) → /writing-plans → /create-issue → /resolve-issue → cr-fix loop → merge → /post-merge
```

각 단계가 명령 한 줄. 단계 사이마다 사용자가 결과를 확인하고 다음으로 넘긴다.
