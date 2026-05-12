# Spec: ERP 주문 승인 미니 시스템

> 주문 승인 use case의 도메인 spec 한 장.

## 목표

`PENDING_APPROVAL` 상태의 주문을 다음 규칙으로 승인 처리한다.

- 고객 등급 할인 (NORMAL 0% / SILVER 5% / GOLD 10%) 을 적용한다.
- 주문 라인의 상품 재고가 충분하면 차감하고 상태를 `APPROVED`로 전이한다.
- 재고가 부족하면 `OutOfStockError`를 throw하고 상태/재고를 그대로 둔다.
- `PENDING_APPROVAL`이 아닌 주문은 `InvalidOrderStatusTransitionError`를 throw한다.
- 존재하지 않는 주문은 `OrderNotFoundError`를 throw한다.

## 변경 파일

- 채워야 할 파일: `src/core/domain/policies/DiscountPolicy.ts`, `src/core/application/use-cases/ApproveOrderUseCase.ts`
- 이미 구현된 파일: `src/core/domain/entities/Order.ts` (상태 전이), `src/core/domain/errors/OrderApprovalError.ts`, `src/core/application/interfaces/*`, `src/infrastructure/repositories/InMemory*Repository.ts`, `src/infrastructure/container.ts`, `src/app/orders/*`

## 테스트 전략

- Domain: `tests/domain/DiscountPolicy.test.ts` (5 케이스), `tests/domain/OrderStatusTransition.test.ts` (5 케이스, 이미 통과)
- Application: `tests/application/ApproveOrderUseCase.test.ts` (4 케이스, 정상/재고부족/잘못된전이/없는주문)

## 위험 요소

- `page.tsx`나 `actions.ts`에 비즈니스 로직(할인, 재고 차감)을 직접 박을 수 있다 → Plan 단계에서 막는다.
- 새 패키지(prisma, decimal.js, lodash 등)를 제안할 수 있다 → in-memory + 표준 Math로 충분하다고 좁힌다.
- 반올림 방향(round vs floor)은 테스트가 `Math.round`로 가정한다.

## 검증 명령

```
npm test
npm run lint
npm run dev   # http://localhost:3000/orders 에서 ORD-2003(키보드 5개 vs 재고 3개) 으로 재고 부족 시나리오 확인
```

## 범위 밖

- 외부 hosted DB, 인증, 결제, 배포
- 부분 승인 / 부분 차감
- 동시 승인 (race condition)
- 주문 라인의 productId가 products.json에 없는 경우 처리 (본 범위 밖, 향후 확장 주제)
