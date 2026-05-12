import { Order } from "@/core/domain/entities/Order";
import type { OrderRepository } from "@/core/application/interfaces/OrderRepository";

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order>;

  constructor(seed: Order[] = []) {
    this.orders = new Map(seed.map((o) => [o.id, o]));
  }

  add(order: Order): void {
    this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findAll(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }
}
