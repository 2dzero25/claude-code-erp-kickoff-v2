import { describe, it, expect } from "vitest";
import { Order } from "@/core/domain/entities/Order";
import type { OrderStatus } from "@/core/domain/entities/Order";

function makeOrder(status: OrderStatus): Order {
  return new Order("ORD-T", "CUST-T", "NORMAL", [], status);
}

describe("Order status transition", () => {
  it("DRAFT -> PENDING_APPROVAL is allowed", () => {
    const order = makeOrder("DRAFT");
    order.transitionTo("PENDING_APPROVAL");
    expect(order.status).toBe("PENDING_APPROVAL");
  });

  it("PENDING_APPROVAL -> APPROVED is allowed", () => {
    const order = makeOrder("PENDING_APPROVAL");
    order.transitionTo("APPROVED");
    expect(order.status).toBe("APPROVED");
  });

  it("DRAFT -> APPROVED is rejected (must go through PENDING_APPROVAL)", () => {
    const order = makeOrder("DRAFT");
    expect(() => order.transitionTo("APPROVED")).toThrow();
  });

  it("APPROVED is terminal", () => {
    const order = makeOrder("APPROVED");
    expect(() => order.transitionTo("REJECTED")).toThrow();
    expect(() => order.transitionTo("PENDING_APPROVAL")).toThrow();
  });

  it("CANCELLED is terminal", () => {
    const order = makeOrder("CANCELLED");
    expect(() => order.transitionTo("APPROVED")).toThrow();
    expect(() => order.transitionTo("DRAFT")).toThrow();
  });
});
