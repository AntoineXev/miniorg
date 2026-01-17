"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-zinc-100">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex flex-1 flex-col overflow-hidden p-2">
          <main className="flex-1 overflow-auto rounded-lg border bg-card shadow-sm">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
