import Link from "next/link";
import { orderRepository } from "@/infrastructure/container";
import type { OrderStatus } from "@/core/domain/entities/Order";
import { StatusBadge } from "./_components/StatusBadge";
import { StatusTabs } from "./_components/StatusTabs";
import { Grade } from "./_components/Grade";
import { BellIcon, ArrowRightIcon } from "../_components/icons";

type TabKey = "ALL" | OrderStatus;

const VALID_TABS: TabKey[] = [
  "ALL",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
];

function resolveTab(input: string | undefined): TabKey {
  if (!input) return "ALL";
  return (VALID_TABS as string[]).includes(input) ? (input as TabKey) : "ALL";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = resolveTab(status);
  const all = await orderRepository.findAll();

  const counts: Record<TabKey, number> = {
    ALL: all.length,
    PENDING_APPROVAL: all.filter((o) => o.status === "PENDING_APPROVAL").length,
    APPROVED: all.filter((o) => o.status === "APPROVED").length,
    REJECTED: all.filter((o) => o.status === "REJECTED").length,
    DRAFT: all.filter((o) => o.status === "DRAFT").length,
    CANCELLED: all.filter((o) => o.status === "CANCELLED").length,
  };

  const visible =
    active === "ALL" ? all : all.filter((o) => o.status === active);
  const pendingCount = counts.PENDING_APPROVAL;

  return (
    <>
      <header className="erp-page-h">
        <h1>주문 관리</h1>
        <p className="sub">
          PENDING_APPROVAL 상태의 주문을 검토하고 승인 또는 거절합니다.
        </p>
      </header>

      <StatusTabs active={active} counts={counts} />

      <div className="erp-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>주문번호</th>
              <th>고객</th>
              <th>품목 요약</th>
              <th className="right" style={{ width: 160 }}>합계</th>
              <th style={{ width: 130 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    color: "var(--fg-alternative)",
                  }}
                >
                  해당 상태의 주문이 없습니다.
                </td>
              </tr>
            ) : (
              visible.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} className="erp-mono">
                      {o.id}
                    </Link>
                  </td>
                  <td>
                    <div className="erp-cust-line">
                      <span className="erp-cust-id">{o.customerId}</span>
                      <Grade value={o.customerGrade} />
                    </div>
                  </td>
                  <td>
                    {o.lines.length}품목 · {o.totalQuantity()}개
                  </td>
                  <td className="right">
                    <span className="erp-amount">
                      {o.originalAmount().toLocaleString("ko-KR")}원
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingCount > 0 && (
        <aside className="erp-banner">
          <div className="erp-banner-ico">
            <BellIcon />
          </div>
          <div className="erp-banner-body">
            <div className="erp-banner-title">
              처리해야 할 주문 {pendingCount}건
            </div>
            <div className="erp-banner-sub">
              승인 대기 상태가 24시간 이상 지속되면 고객에게 자동 알림이 발송됩니다.
            </div>
          </div>
          {active !== "PENDING_APPROVAL" && (
            <Link href="/orders?status=PENDING_APPROVAL" className="erp-banner-link">
              바로가기 <ArrowRightIcon style={{ width: 14, height: 14 }} />
            </Link>
          )}
        </aside>
      )}
    </>
  );
}
