import Link from "next/link";
import { notFound } from "next/navigation";
import {
  inventoryRepository,
  orderRepository,
} from "@/infrastructure/container";
import { ArrowLeftIcon, AlertTriangleIcon, InfoIcon } from "@/app/_components/icons";
import { StatusBadge } from "../_components/StatusBadge";
import { Grade } from "../_components/Grade";
import { StatusTimeline } from "./_components/StatusTimeline";
import { ApproveButton } from "./ApproveButton";

const fmt = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await orderRepository.findById(orderId);
  if (!order) notFound();

  const lines = await Promise.all(
    order.lines.map(async (l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      subtotal: l.unitPrice * l.quantity,
      stock: await inventoryRepository.getStock(l.productId),
    })),
  );

  const totalAmount = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const hasShortage = lines.some((l) => l.stock < l.quantity);
  const approvable = order.status === "PENDING_APPROVAL" && !hasShortage;
  const isPending = order.status === "PENDING_APPROVAL";

  return (
    <>
      <Link href="/orders" className="erp-back">
        <ArrowLeftIcon /> 주문 목록
      </Link>

      <header style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div className="erp-detail-h">
          <h1>{order.id}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="erp-detail-sub">
          <span>
            고객 <span className="cust-mono">{order.customerId}</span>
          </span>
          <span className="dot">·</span>
          <span>
            등급 <Grade value={order.customerGrade} />
          </span>
        </p>
      </header>

      <StatusTimeline current={order.status} />

      <div className="erp-info-grid">
        <div className="erp-info-card">
          <div className="erp-info-h">주문 정보</div>
          <div className="erp-info-row">
            <span className="k">주문 번호</span>
            <span className="v mono">{order.id}</span>
          </div>
          <div className="erp-info-row">
            <span className="k">상태</span>
            <span className="v">
              <StatusBadge status={order.status} />
              <span className="status-code">{order.status}</span>
            </span>
          </div>
          <div className="erp-info-row">
            <span className="k">품목 수</span>
            <span className="v">
              {order.lines.length}품목 · {order.totalQuantity()}개
            </span>
          </div>
        </div>

        <div className="erp-info-card">
          <div className="erp-info-h">고객 정보</div>
          <div className="erp-info-row">
            <span className="k">고객 ID</span>
            <span className="v mono">{order.customerId}</span>
          </div>
          <div className="erp-info-row">
            <span className="k">등급</span>
            <span className="v">
              <Grade value={order.customerGrade} />
            </span>
          </div>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-items-h">
          <div className="t">주문 상품</div>
          <div className="c">총 {order.lines.length}개 품목</div>
        </div>
        <table className="erp-table">
          <thead>
            <tr>
              <th>상품</th>
              <th className="right">수량</th>
              <th className="right">단가</th>
              <th className="right">소계</th>
              <th className="right" style={{ width: 130 }}>재고</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const ok = l.stock >= l.quantity;
              return (
                <tr key={l.productId}>
                  <td>
                    <span className="erp-mono" style={{ color: "#000" }}>
                      {l.productId}
                    </span>
                  </td>
                  <td className="num">{l.quantity}</td>
                  <td className="num">{fmt(l.unitPrice)}</td>
                  <td className="num">
                    <span className="erp-amount">{fmt(l.subtotal)}</span>
                  </td>
                  <td className="right">
                    <div className="erp-stock-row">
                      <span className={`erp-stock-num ${ok ? "" : "is-low"}`}>
                        {l.stock}
                      </span>
                      <span className={`erp-stock ${ok ? "is-ok" : "is-low"}`}>
                        {ok ? "충분" : "부족"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="erp-items-foot">
          <div className="l">합계</div>
          <div className="r">{fmt(totalAmount)}</div>
        </div>
      </div>

      <div className={`erp-action ${isPending && hasShortage ? "is-blocked" : ""}`}>
        <div className="erp-action-msg">
          {isPending && hasShortage ? (
            <>
              <AlertTriangleIcon /> 재고가 부족합니다. 승인할 수 없습니다.
            </>
          ) : isPending ? (
            <>
              <InfoIcon /> 승인 시 재고가 차감되고 상태가 APPROVED로 전이됩니다.
            </>
          ) : (
            <>
              <InfoIcon /> {order.status} 상태의 주문은 승인할 수 없습니다.
            </>
          )}
        </div>
        <ApproveButton orderId={order.id} disabled={!approvable} />
      </div>
    </>
  );
}
