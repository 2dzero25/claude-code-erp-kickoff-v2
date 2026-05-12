import type { OrderStatus } from "@/core/domain/entities/Order";

const STYLE: Record<OrderStatus, { cls: string; label: string }> = {
  DRAFT: { cls: "is-draft", label: "DRAFT" },
  PENDING_APPROVAL: { cls: "is-pending", label: "PENDING" },
  APPROVED: { cls: "is-approved", label: "APPROVED" },
  REJECTED: { cls: "is-rejected", label: "REJECTED" },
  CANCELLED: { cls: "is-cancelled", label: "CANCELLED" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { cls, label } = STYLE[status];
  return <span className={`erp-pill ${cls}`}>{label}</span>;
}
