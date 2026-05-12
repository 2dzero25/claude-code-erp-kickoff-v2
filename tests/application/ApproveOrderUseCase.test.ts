import { describe, it, expect, beforeEach } from "vitest";
import { ApproveOrderUseCase } from "@/core/application/use-cases/ApproveOrderUseCase";
import { InMemoryOrderRepository } from "@/infrastructure/repositories/InMemoryOrderRepository";
import { InMemoryInventoryRepository } from "@/infrastructure/repositories/InMemoryInventoryRepository";
import { Order } from "@/core/domain/entities/Order";
import {
  OutOfStockError,
  OrderNotFoundError,
  InvalidOrderStatusTransitionError,
} from "@/core/domain/errors/OrderApprovalError";

describe("ApproveOrderUseCase", () => {
  let orderRepo: InMemoryOrderRepository;
  let inventoryRepo: InMemoryInventoryRepository;
  let useCase: ApproveOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository([]);
    inventoryRepo = new InMemoryInventoryRepository({});
    useCase = new ApproveOrderUseCase(orderRepo, inventoryRepo);
  });

  it("재고가 충분하면 주문이 APPROVED로 전이되고 재고가 차감된다", async () => {
    const order = new Order(
      "ORD-1",
      "CUST-1",
      "GOLD",
      [{ productId: "P-1", quantity: 2, unitPrice: 100000 }],
      "PENDING_APPROVAL",
    );
    orderRepo.add(order);
    inventoryRepo.set("P-1", 5);

    const result = await useCase.execute({ orderId: "ORD-1" });

    const stored = await orderRepo.findById("ORD-1");
    expect(stored?.status).toBe("APPROVED");
    // GOLD 10% 할인: 200000 - 20000 = 180000
    expect(result.finalAmount).toBe(180000);
    expect(await inventoryRepo.getStock("P-1")).toBe(3);
  });

  it("재고 부족이면 OutOfStockError를 throw하고 상태/재고는 유지된다", async () => {
    const order = new Order(
      "ORD-2",
      "CUST-1",
      "NORMAL",
      [{ productId: "P-1", quantity: 5, unitPrice: 100000 }],
      "PENDING_APPROVAL",
    );
    orderRepo.add(order);
    inventoryRepo.set("P-1", 2);

    await expect(useCase.execute({ orderId: "ORD-2" })).rejects.toBeInstanceOf(
      OutOfStockError,
    );

    const stored = await orderRepo.findById("ORD-2");
    expect(stored?.status).toBe("PENDING_APPROVAL");
    expect(await inventoryRepo.getStock("P-1")).toBe(2);
  });

  it("PENDING_APPROVAL이 아닌 주문은 InvalidOrderStatusTransitionError를 throw한다", async () => {
    const order = new Order(
      "ORD-3",
      "CUST-1",
      "NORMAL",
      [{ productId: "P-1", quantity: 1, unitPrice: 100000 }],
      "DRAFT",
    );
    orderRepo.add(order);
    inventoryRepo.set("P-1", 5);

    await expect(useCase.execute({ orderId: "ORD-3" })).rejects.toBeInstanceOf(
      InvalidOrderStatusTransitionError,
    );
  });

  it("존재하지 않는 주문은 OrderNotFoundError를 throw한다", async () => {
    await expect(
      useCase.execute({ orderId: "ORD-NOPE" }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});
