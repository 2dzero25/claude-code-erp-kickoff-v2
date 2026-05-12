# Task 2 — issue 를 implement + review + fix loop

Task 1 에서 만든 issue 하나를 골라서 끝까지 처리한다. branch → implement → PR → Claude Code Review → cr-fix loop 까지 한 명령어로.

## 사전 조건

- Task 1 완료 — 두 issue 등록됨 (`gh issue list` 로 확인)
- 본 저장소의 trigger 모드가 `After every push` 로 설정됨 (`00-setup.md` 참고)
- 현재 branch 가 default branch (`main`) 이고 working tree 깨끗

## 운영 방식

`/resolve-issue <n>` slash command 를 호출. Claude 가 자동으로:

1. issue 파악 (`gh issue view`) + TDD marker 확인
2. branch 생성 (`feat/<n>-<slug>`)
3. 구현 계획 (변경 파일 / 흐름 / 위험) 짧게 출력 + 사용자 승인
4. 구현 — TDD marker 있으면 Red-Green-Refactor, 없으면 직접
5. `npm test` + `npm run lint` 통과 검증
6. 변경 파일만 staging + commit + push + `gh pr create`
7. **자동으로 `/cr-fix` 호출** — Claude Code Review polling → 결과 fetch → 사용자 검토 → apply → push → 재리뷰. 수렴까지 반복

자세한 내부 흐름은 `.claude/commands/resolve-issue.md`, `.claude/commands/cr-fix.md` 참고.

## 사용

먼저 issue 번호 확인:

```bash
gh issue list --state open
```

`#1` 또는 `#2` 중 하나 골라서:

```
/resolve-issue 1
```

먼저 `DiscountPolicy` (Domain layer) 부터 푸는 게 자연스럽다. `ApproveOrderUseCase` 가 `DiscountPolicy` 를 호출하기 때문.

## cr-fix loop 흐름

PR 생성 직후 Claude Code Review 가 자동 트리거 ("After every push" 모드). 약 1-20분 후 review 결과 도착. cr-fix loop 가:

1. check run 결과 polling
2. inline 코멘트 + top-level 요약 + 심각도 카운트 fetch
3. 항목별로 사용자에게 보여줌 — Apply / Defer / Skip
4. Apply 선택한 것만 적용 후 commit + push
5. push 가 다시 Code Review 트리거 → 1번으로 돌아감
6. 모든 항목 처리되거나 (`normal: 0, nit: 0`) max iteration 도달까지 반복

학생은 사이사이 Apply / Skip 만 누르면 된다. branch / commit / push / 재리뷰 트리거는 모두 자동.

## 결과 확인

- PR URL 보고됨 → 브라우저로 열어서 review 코멘트 + 적용된 fix 확인
- `gh pr checks` 로 `Claude Code Review` 상태 확인
- merge 는 직접 (auto-merge 안 함). green 이면 `gh pr merge --squash --delete-branch`

## 두 번째 issue 도 같은 방식

첫 issue (`DiscountPolicy`) 처리 후 merge 까지 끝나면, 두 번째 issue (`ApproveOrderUseCase`) 도 같은 명령으로:

```
/resolve-issue 2
```

전체 끝나면 `npm test` 14/14 통과 + preview 화면 (`npm run dev`) 의 승인 흐름이 끝까지 동작한다.

## 트러블슈팅

- **review check run 이 안 뜸** → `00-setup.md` 의 트리거 모드 확인. `After every push` 가 아니면 `@claude review once` 댓글로 수동 트리거 가능
- **review 가 30분 넘게 안 끝남** → Anthropic 인프라 지연. `gh pr view <n> --web` 으로 GitHub UI 에서 확인
- **review 가 영어로 나옴** → `REVIEW.md` 첫 줄에 `한국어로 답한다.` 확인. 누락됐으면 보강 후 다시 push
- **cr-fix iteration 5회 도달했는데 아직 normal > 0** → 사용자가 직접 PR conversation 확인. 의도적 결정인지 잘못된 fix 인지 판단 후 직접 수정
