import { Order } from "@/core/domain/entities/Order";
import type { CustomerGrade } from "@/core/domain/entities/Customer";
import type { OrderStatus, OrderLine } from "@/core/domain/entities/Order";
import { ApproveOrderUseCase } from "@/core/application/use-cases/ApproveOrderUseCase";
import { InMemoryOrderRepository } from "@/infrastructure/repositories/InMemoryOrderRepository";
import { InMemoryInventoryRepository } from "@/infrastructure/repositories/InMemoryInventoryRepository";

import productsSeed from "./data/products.json";
import ordersSeed from "./data/orders.json";

interface OrderSeed {
  id: string;
  customerId: string;
  customerGrade: CustomerGrade;
  status: OrderStatus;
  lines: OrderLine[];
}

interface ProductSeed {
  id: string;
  name: string;
  stock: number;
}

const orderEntities = (ordersSeed as OrderSeed[]).map(
  (o) => new Order(o.id, o.customerId, o.customerGrade, o.lines, o.status),
);

const stockMap = Object.fromEntries(
  (productsSeed as ProductSeed[]).map((p) => [p.id, p.stock]),
);

export const orderRepository = new InMemoryOrderRepository(orderEntities);
export const inventoryRepository = new InMemoryInventoryRepository(stockMap);
export const approveOrderUseCase = new ApproveOrderUseCase(
  orderRepository,
  inventoryRepository,
);
