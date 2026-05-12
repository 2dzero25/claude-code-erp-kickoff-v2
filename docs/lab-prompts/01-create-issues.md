# Task 1 — 두 TODO 를 GitHub issue 로 등록

이 저장소에는 두 군데 비어 있는 자리가 있다.

- `src/core/domain/policies/DiscountPolicy.ts` — 고객 등급별 할인 정책
- `src/core/application/use-cases/ApproveOrderUseCase.ts` — 주문 승인 use case

각각을 GitHub issue 로 등록해서 work item 단위로 관리한다. 다음 Task 2 에서 issue 하나씩 implement → PR → review → fix 로 끌고 간다.

## 사전 조건

- `00-setup.md` 완료 — gh CLI + Code Review 활성화 + `After every push` 트리거 모드
- 본 저장소가 GitHub remote 에 push 된 상태 (`gh repo view` 통과)

## 운영 방식

`/create-issue` slash command 를 호출하면서 두 TODO 를 인자로 알려준다. command 는 범용 (어느 프로젝트에서도 동작) 이라 lab 의 ERP 맥락을 여기서 주입한다.

세션에서:

```
/create-issue
```

또는 한 번에 명시:

```
/create-issue src/core/domain/policies/DiscountPolicy.ts 와 src/core/application/use-cases/ApproveOrderUseCase.ts 두 TODO 를 각각 GitHub issue 로 등록해줘. 각각의 테스트 파일도 같이 참조해서 issue body 의 완료 기준에 반영해.
```

Claude 가:

1. 두 TODO 파일 + 관련 테스트 (`tests/domain/DiscountPolicy.test.ts`, `tests/application/ApproveOrderUseCase.test.ts`) 분석
2. issue body draft 2 개 미리보기 (TDD marker 자동 부여)
3. 사용자 승인 (Apply / 수정 / 취소)
4. `gh issue create` 두 번 실행
5. 결과 issue 번호 + URL 보고

자세한 내부 흐름은 `.claude/commands/create-issue.md` 참고.

## 도메인 맥락 (Claude 가 draft 채울 때 참조할 정보)

- 도메인 spec: `.claude/spec/order-approval.md` — 할인 규칙 (NORMAL 0% / SILVER 5% / GOLD 10%), 상태 전이, 에러 종류
- 아키텍처 규칙: `docs/rules/architecture.md` — Clean Architecture 4 계층 의존성 방향
- TDD 규칙: `docs/rules/tdd.md` — Red-Green-Refactor
- 검증 명령: `npm test`, `npm run lint`

## 결과 확인

```bash
gh issue list --state open
```

두 issue 가 등록되어 있어야 한다. 각 issue body 에는:

- `<!-- TDD: enabled -->` marker (다음 task 의 `/resolve-issue` 가 읽는다)
- 구현 단계 (Implementation Steps) — 체크박스
- 수정할 파일 목록
- 완료 기준 (Completion criteria — `npm test`, `npm run lint` 통과 + PR 리뷰 통과)

## 다음 단계

`docs/lab-prompts/02-resolve-issue.md` — 등록된 issue 한 개 골라서 끝까지 처리.
