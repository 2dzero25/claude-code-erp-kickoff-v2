# ERP 주문 승인 미니 시스템 (v2 — issue 기반 흐름)

ERP 도메인의 주문 승인 흐름을 다루는 작은 Next.js 프로젝트다. 고객 등급별 할인, 주문 상태 전이, 재고 차감 같은 비즈니스 규칙을 Domain / Application 계층에 격리해서 구현하는 패턴을 익히는 lab repo.

**v2 의 핵심 메시지**: 기획만 잘 잡으면 구현과 리뷰는 자동화로 굴러간다. TODO 두 개를 GitHub issue 로 등록 → branch / implement / PR / Claude Code Review / fix loop 까지 한 slash command 가 끝까지 끌고 간다.

> v1 (`claude-code-erp-kickoff`) 은 같은 ERP TODO 를 **Plan mode 직접 운영** + **subagent 위임** 두 패턴으로 다룬다. v2 는 같은 base 에서 **GitHub issue + Claude Code Action** 패턴으로 갈아탔다.

## 환경

- Node.js 20 LTS 이상
- npm
- GitHub CLI (`gh`) — `00-setup.md` 에 설치 안내
- Anthropic Pro / Max 구독 또는 API key (Claude Code Review 인증용)

## 설치와 실행

```bash
npm install
npm test          # 처음 실행 시 빨간 줄 8개 — 아직 채워야 할 부분이 있다
npm run dev       # http://localhost:3000/orders
npm run lint
```

## 진행 순서

세 단계로 lab 을 끌고 간다. 각 단계의 brief 를 차례로 따라가면 14 개 테스트가 모두 green 이 되고 preview 화면의 승인 흐름이 끝까지 동작한다.

1. **[Setup](docs/lab-prompts/00-setup.md)** — gh CLI 설치 + Claude Code Review 활성화 (`/install-github-app`) + 트리거 모드 `After every push` 설정
2. **[Task 1](docs/lab-prompts/01-create-issues.md)** — `/create-issue` 로 두 TODO 를 GitHub issue 2 개로 등록
3. **[Task 2](docs/lab-prompts/02-resolve-issue.md)** — `/resolve-issue <n>` 로 issue 하나씩 branch + implement + PR + cr-fix loop 까지

## 채워야 할 TODO 두 군데

이 repo 는 두 개의 핵심 비즈니스 규칙이 비어 있는 상태로 시작한다.

1. **DiscountPolicy** — 고객 등급별 할인율
   - 파일: [`src/core/domain/policies/DiscountPolicy.ts`](src/core/domain/policies/DiscountPolicy.ts)
   - 테스트: `tests/domain/DiscountPolicy.test.ts` (5 케이스)
2. **ApproveOrderUseCase** — 주문 승인 use case 흐름
   - 파일: [`src/core/application/use-cases/ApproveOrderUseCase.ts`](src/core/application/use-cases/ApproveOrderUseCase.ts)
   - 테스트: `tests/application/ApproveOrderUseCase.test.ts` (4 케이스)

`src/core/domain/entities/Order.ts` 의 상태 전이 로직 (`canTransitionTo` / `transitionTo`) 은 이미 구현되어 있다. 직접 throw 대신 이 메서드들을 활용하면 application 계층이 도메인 규칙을 다시 짜지 않아도 된다.

## 작업 규칙

- [`CLAUDE.md`](CLAUDE.md) — Plan mode 우선, 비즈니스 규칙은 Domain / Application 계층에 둠, 외부 hosted DB / 인증 / 결제 / 새 패키지 도입은 범위 밖
- [`REVIEW.md`](REVIEW.md) — Claude Code Review 의 system prompt. 한국어 응답 + Important / Nit 정의 + 항상 확인하는 항목
- [`docs/rules/architecture.md`](docs/rules/architecture.md) — Clean Architecture 의존성 방향
- [`docs/rules/nextjs-framework.md`](docs/rules/nextjs-framework.md) — App Router, Server Component 우선
- [`docs/rules/tdd.md`](docs/rules/tdd.md) — Red-Green-Refactor
- [`docs/rules/tech-stack.md`](docs/rules/tech-stack.md) — in-memory repository, Supabase / RLS 미사용

## Spec 및 명령어 자산

- [`.claude/spec/order-approval.md`](.claude/spec/order-approval.md) — 주문 승인 도메인 spec 한 장
- [`.claude/commands/create-issue.md`](.claude/commands/create-issue.md) — Task 1 slash command
- [`.claude/commands/resolve-issue.md`](.claude/commands/resolve-issue.md) — Task 2 slash command
- [`.claude/commands/cr-fix.md`](.claude/commands/cr-fix.md) — Code Review 결과 받아 자동 fix loop

세 slash command 모두 [github-dev plugin](https://github.com/anthropics) 의 `decompose-issue` / `resolve-issue` / `cr-fix` 를 ERP lab 범위에 맞춰 한글로 압축한 것.

## 시연 시나리오

`npm run dev` 후 두 주문으로 양 끝 시나리오를 확인할 수 있다.

- `ORD-2001` (GOLD 고객, 노트북 2 대 vs 재고 8) — 정상 승인 가능
- `ORD-2003` (SILVER 고객, 키보드 5 개 vs 재고 3) — 재고 부족으로 승인 불가
