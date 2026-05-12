import type {
  OrderApprovalDto,
  OrderApprovalResult,
} from "@/core/application/dtos/OrderApprovalDto";
import type { OrderRepository } from "@/core/application/interfaces/OrderRepository";
import type { InventoryRepository } from "@/core/application/interfaces/InventoryRepository";

/**
 * Approve a pending order.
 *
 * TODO: 주문 승인 use case를 구현한다.
 * 자세한 흐름과 에러 분기는 docs/lab-prompts/02-approve-order-use-case.md 참고.
 *
 * 통과해야 하는 테스트: tests/application/ApproveOrderUseCase.test.ts (4)
 */
export class ApproveOrderUseCase {
  constructor(
    private readonly _orderRepository: OrderRepository,
    private readonly _inventoryRepository: InventoryRepository,
  ) {}

  async execute(_dto: OrderApprovalDto): Promise<OrderApprovalResult> {
    throw new Error("ApproveOrderUseCase.execute is not implemented yet");
  }
}
