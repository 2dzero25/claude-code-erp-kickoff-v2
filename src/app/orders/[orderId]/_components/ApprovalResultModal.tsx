"use client";

import {
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
} from "@/app/_components/icons";
import { Grade } from "../../_components/Grade";
import type { ApproveOrderResult } from "../../actions";

export function ApprovalResultModal({
  result,
  onClose,
}: {
  result: ApproveOrderResult;
  onClose: () => void;
}) {
  const success = result.ok;

  return (
    <div className="erp-scrim" role="dialog" aria-modal="true">
      <div className="erp-dialog">
        <button className="erp-dialog-x" aria-label="닫기" onClick={onClose}>
          <XIcon />
        </button>
        <div className={`erp-dialog-ico ${success ? "is-success" : "is-fail"}`}>
          {success ? <CheckIcon /> : <AlertTriangleIcon />}
        </div>
        <h2>{success ? "승인 완료" : "승인 실패"}</h2>
        <p className="erp-dialog-body">
          {success ? (
            <>
              주문 <span className="mono">{result.orderId}</span>이 승인되었습니다.
            </>
          ) : (
            <>
              주문 <span className="mono">{result.orderId}</span>을 승인할 수 없습니다.
            </>
          )}
        </p>

        {success ? (
          <SuccessDetail result={result} />
        ) : (
          <FailureDetail result={result} />
        )}

        <div className="erp-dialog-foot">
          <button
            className={success ? "erp-btn" : "erp-btn is-secondary"}
            onClick={onClose}
          >
            {success ? "확인" : "닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessDetail({
  result,
}: {
  result: Extract<ApproveOrderResult, { ok: true }>;
}) {
  return (
    <div className="erp-dialog-detail">
      <div className="row">
        <span className="k">최종 금액</span>
        <span className="v amount">
          {result.finalAmount.toLocaleString("ko-KR")}원
        </span>
      </div>
      <div className="row">
        <span className="k">적용 할인</span>
        <span className="v">
          <Grade value={result.grade} /> {result.discountPercent}%
        </span>
      </div>
      {result.stockChanges.map((s) => (
        <div className="row" key={s.productId}>
          <span className="k">차감 재고</span>
          <span className="v mono">
            {s.productId}
            <span className="strike">{s.before}</span>
            <span className="arrow">→</span>
            <span style={{ color: "var(--pill-rejected-fg)" }}>{s.after}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function FailureDetail({
  result,
}: {
  result: Extract<ApproveOrderResult, { ok: false }>;
}) {
  if (result.reason === "OUT_OF_STOCK") {
    return (
      <div className="erp-dialog-detail">
        <div className="row">
          <span className="k">사유</span>
          <span className="v danger">재고 부족</span>
        </div>
        {result.productId && (
          <div className="row">
            <span className="k">상품</span>
            <span className="v mono">{result.productId}</span>
          </div>
        )}
        {result.requested !== undefined && (
          <div className="row">
            <span className="k">요청 수량</span>
            <span className="v mono">{result.requested}</span>
          </div>
        )}
        {result.available !== undefined && (
          <div className="row">
            <span className="k">가용 재고</span>
            <span className="v mono danger">{result.available}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="erp-dialog-detail">
      <div className="row">
        <span className="k">사유</span>
        <span className="v danger">{labelOfReason(result.reason)}</span>
      </div>
      <div className="row">
        <span className="k">메시지</span>
        <span className="v" style={{ fontWeight: 500 }}>
          {result.message}
        </span>
      </div>
    </div>
  );
}

function labelOfReason(reason: "INVALID_TRANSITION" | "NOT_FOUND" | "OTHER"): string {
  if (reason === "INVALID_TRANSITION") return "잘못된 상태 전이";
  if (reason === "NOT_FOUND") return "주문 없음";
  return "오류";
}
