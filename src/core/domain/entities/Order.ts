import type { CustomerGrade } from "@/core/domain/entities/Customer";
import { InvalidOrderStatusTransitionError } from "@/core/domain/errors/OrderApprovalError";

export type OrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export class Order {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly customerGrade: CustomerGrade,
    public readonly lines: OrderLine[],
    private _status: OrderStatus,
  ) {}

  get status(): OrderStatus {
    return this._status;
  }

  canTransitionTo(target: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[this._status].includes(target);
  }

  transitionTo(target: OrderStatus): void {
    if (!this.canTransitionTo(target)) {
      throw new InvalidOrderStatusTransitionError(this._status, target);
    }
    this._status = target;
  }

  totalQuantity(): number {
    return this.lines.reduce((sum, l) => sum + l.quantity, 0);
  }

  originalAmount(): number {
    return this.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  }
}
