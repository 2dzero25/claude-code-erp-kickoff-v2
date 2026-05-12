"use server";

import { revalidatePath } from "next/cache";
import {
  approveOrderUseCase,
  inventoryRepository,
  orderRepository,
} from "@/infrastructure/container";
import type { CustomerGrade } from "@/core/domain/entities/Customer";
import {
  InvalidOrderStatusTransitionError,
  OrderNotFoundError,
  OutOfStockError,
} from "@/core/domain/errors/OrderApprovalError";

export type StockChange = {
  productId: string;
  before: number;
  after: number;
};

export type ApproveOrderResult =
  | {
      ok: true;
      orderId: string;
      finalAmount: number;
      grade: CustomerGrade;
      discountPercent: number;
      stockChanges: StockChange[];
    }
  | {
      ok: false;
      orderId: string;
      reason: "OUT_OF_STOCK" | "INVALID_TRANSITION" | "NOT_FOUND" | "OTHER";
      productId?: string;
      requested?: number;
      available?: number;
      message: string;
    };

export async function approveOrder(
  orderId: string,
): Promise<ApproveOrderResult> {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    return {
      ok: false,
      orderId,
      reason: "NOT_FOUND",
      message: `주문을 찾을 수 없습니다: ${orderId}`,
    };
  }

  const beforeStocks = new Map<string, number>();
  for (const line of order.lines) {
    beforeStocks.set(
      line.productId,
      await inventoryRepository.getStock(line.productId),
    );
  }
  const originalAmount = order.originalAmount();
  const grade = order.customerGrade;

  try {
    const result = await approveOrderUseCase.execute({ orderId });

    const stockChanges: StockChange[] = [];
    for (const line of order.lines) {
      stockChanges.push({
        productId: line.productId,
        before: beforeStocks.get(line.productId) ?? 0,
        after: await inventoryRepository.getStock(line.productId),
      });
    }

    const discountPercent =
      originalAmount > 0
        ? Math.round((1 - result.finalAmount / originalAmount) * 100)
        : 0;

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");

    return {
      ok: true,
      orderId,
      finalAmount: result.finalAmount,
      grade,
      discountPercent,
      stockChanges,
    };
  } catch (e) {
    if (e instanceof OutOfStockError) {
      return {
        ok: false,
        orderId,
        reason: "OUT_OF_STOCK",
        productId: e.productId,
        requested: e.requested,
        available: e.available,
        message: "재고 부족",
      };
    }
    if (e instanceof InvalidOrderStatusTransitionError) {
      return {
        ok: false,
        orderId,
        reason: "INVALID_TRANSITION",
        message: `허용되지 않는 상태 전이: ${e.from} → ${e.to}`,
      };
    }
    if (e instanceof OrderNotFoundError) {
      return {
        ok: false,
        orderId,
        reason: "NOT_FOUND",
        message: e.message,
      };
    }
    return {
      ok: false,
      orderId,
      reason: "OTHER",
      message: (e as Error).message,
    };
  }
}
