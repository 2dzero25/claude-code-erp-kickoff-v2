import type { InventoryRepository } from "@/core/application/interfaces/InventoryRepository";

export class InMemoryInventoryRepository implements InventoryRepository {
  private stocks: Map<string, number>;

  constructor(seed: Record<string, number> = {}) {
    this.stocks = new Map(Object.entries(seed));
  }

  set(productId: string, quantity: number): void {
    this.stocks.set(productId, quantity);
  }

  async getStock(productId: string): Promise<number> {
    return this.stocks.get(productId) ?? 0;
  }

  async decrement(productId: string, quantity: number): Promise<void> {
    const current = this.stocks.get(productId) ?? 0;
    if (current < quantity) {
      throw new Error(
        `재고 부족으로 차감 불가: ${productId} (current=${current}, requested=${quantity})`,
      );
    }
    this.stocks.set(productId, current - quantity);
  }
}
