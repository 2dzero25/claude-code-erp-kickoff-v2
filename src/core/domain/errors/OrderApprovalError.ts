import type { OrderStatus } from "@/core/domain/entities/Order";

export class OrderApprovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderApprovalError";
  }
}

export class OrderNotFoundError extends OrderApprovalError {
  constructor(orderId: string) {
    super(`주문을 찾을 수 없습니다: ${orderId}`);
    this.name = "OrderNotFoundError";
  }
}

export class OutOfStockError extends OrderApprovalError {
  constructor(
    public readonly productId: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(
      `재고 부족: 상품 ${productId}, 요청 ${requested}, 가용 ${available}`,
    );
    this.name = "OutOfStockError";
  }
}

export class InvalidOrderStatusTransitionError extends OrderApprovalError {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`허용되지 않는 상태 전이: ${from} → ${to}`);
    this.name = "InvalidOrderStatusTransitionError";
  }
}
