"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveOrder, type ApproveOrderResult } from "../actions";
import { ApprovalResultModal } from "./_components/ApprovalResultModal";

export function ApproveButton({
  orderId,
  disabled,
}: {
  orderId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ApproveOrderResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await approveOrder(orderId);
      setResult(res);
    });
  }

  function handleClose() {
    setResult(null);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="erp-btn"
        onClick={handleClick}
        disabled={disabled || pending}
      >
        {pending ? "승인 처리 중..." : "주문 승인"}
      </button>
      {result && <ApprovalResultModal result={result} onClose={handleClose} />}
    </>
  );
}
