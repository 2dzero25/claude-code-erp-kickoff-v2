import type { CustomerGrade } from "@/core/domain/entities/Customer";

const CLS: Record<CustomerGrade, string> = {
  GOLD: "is-gold",
  SILVER: "is-silver",
  NORMAL: "is-normal",
};

export function Grade({ value }: { value: CustomerGrade }) {
  return <span className={`erp-grade ${CLS[value]}`}>{value}</span>;
}
