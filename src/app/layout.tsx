import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "./_components/Sidebar";

export const metadata: Metadata = {
  title: "ERP 주문 승인 미니 시스템",
  description: "Claude Code Desktop 강의용 실습 base",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="erp">
          <Sidebar />
          <main className="erp-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
