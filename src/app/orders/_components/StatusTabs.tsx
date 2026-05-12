import Link from "next/link";
import type { OrderStatus } from "@/core/domain/entities/Order";

type TabKey = "ALL" | OrderStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING_APPROVAL", label: "승인 대기" },
  { key: "APPROVED", label: "승인 완료" },
  { key: "REJECTED", label: "거절" },
];

export function StatusTabs({
  active,
  counts,
}: {
  active: TabKey;
  counts: Record<TabKey, number>;
}) {
  return (
    <nav className="erp-tabs">
      {TABS.map((tab) => {
        const href = tab.key === "ALL" ? "/orders" : `/orders?status=${tab.key}`;
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={href}
            className={`erp-tab ${isActive ? "is-active" : ""}`}
          >
            {tab.label}
            <span className="count">{counts[tab.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
