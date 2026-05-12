import Link from "next/link";
import { CartIcon } from "./icons";

export function Sidebar() {
  return (
    <aside className="erp-side">
      <div className="erp-brand">
        <div className="erp-brand-mark">E</div>
        <div className="erp-brand-name">ERP 주문 승인</div>
        <div className="erp-brand-sub">Lab Edition</div>
      </div>
      <nav className="erp-nav">
        <div className="erp-nav-h">Workflow</div>
        <Link href="/orders" className="erp-nav-item is-active">
          <CartIcon />
          주문 관리
        </Link>
      </nav>
      <div className="erp-side-foot">v0.1.0 · Lab build</div>
    </aside>
  );
}
