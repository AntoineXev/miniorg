"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";
import { PlatformProvider } from "@/providers/platform-provider";
import { SessionProvider } from "next-auth/react";
import { TauriSessionProvider } from "@/providers/tauri-session";
import { QuickAddTaskProvider } from "@/providers/quick-add-task";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });
const windowLabel = getCurrentWindow().label;
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, windowLabel === "quick-add" ? "bg-transparent h-screen w-screen" : "")}>
        <SessionProvider>
          <TauriSessionProvider>
            <QuickAddTaskProvider>
              <PlatformProvider>
                <QueryProvider>
                  <TooltipProvider delayDuration={200}>
                    {children}
                  </TooltipProvider>
                  <Toaster position="bottom-center" />
                </QueryProvider>
              </PlatformProvider>
            </QuickAddTaskProvider>
          </TauriSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
