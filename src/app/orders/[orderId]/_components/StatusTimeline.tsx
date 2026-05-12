import { Fragment } from "react";
import type { OrderStatus } from "@/core/domain/entities/Order";
import { CheckIcon } from "@/app/_components/icons";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "DRAFT", label: "작성" },
  { key: "PENDING_APPROVAL", label: "승인 대기" },
  { key: "APPROVED", label: "승인 완료" },
];

type StepState = "is-done" | "is-current" | "is-future";

function resolveSteps(current: OrderStatus): StepState[] {
  const idx = STEPS.findIndex((s) => s.key === current);
  if (idx === -1) {
    return STEPS.map(() => "is-future");
  }
  return STEPS.map((_, i) => {
    if (i < idx) return "is-done";
    if (i === idx) return "is-current";
    return "is-future";
  });
}

export function StatusTimeline({ current }: { current: OrderStatus }) {
  if (current === "REJECTED") {
    return (
      <div
        className="erp-card"
        style={{ padding: "20px 24px", borderColor: "#fed5d5", background: "#fffafa" }}
      >
        <strong style={{ color: "#e52222", fontSize: 14, fontWeight: 700 }}>
          주문이 거절되었습니다.
        </strong>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-normal)" }}>
          승인 흐름을 종료한 상태입니다.
        </p>
      </div>
    );
  }
  if (current === "CANCELLED") {
    return (
      <div className="erp-card" style={{ padding: "20px 24px" }}>
        <strong style={{ fontSize: 14, fontWeight: 700 }}>주문이 취소되었습니다.</strong>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-normal)" }}>
          취소된 주문은 다시 활성화할 수 없습니다.
        </p>
      </div>
    );
  }

  const states = resolveSteps(current);

  return (
    <div className="erp-timeline">
      {STEPS.map((step, i) => {
        const state = states[i];
        return (
          <Fragment key={step.key}>
            <div className={`erp-tl-step ${state}`}>
              <div className={`erp-tl-circle ${state}`}>
                {state === "is-done" ? <CheckIcon /> : i + 1}
              </div>
              <div className="erp-tl-label">
                <div className="erp-tl-label-t">{step.label}</div>
                <div className="erp-tl-label-s">{step.key}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`erp-tl-line ${states[i] === "is-done" ? "is-done" : ""}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
