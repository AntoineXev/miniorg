"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PopoverProvider } from "@/components/ui/popover";
import { QueryProvider } from "@/providers/query-provider";
import { PlatformProvider, usePlatform } from "@/providers/platform-provider";
import { SessionProvider } from "next-auth/react";
import { TauriSessionProvider } from "@/providers/tauri-session";
import { QuickAddTaskProvider } from "@/providers/quick-add-task";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "@/lib/utils";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let windowLabel = "";
  
  try {windowLabel = getCurrentWindow()?.label ?? "";}
  catch (error) {}
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, windowLabel === "quick-add" ? "bg-transparent h-screen w-screen" : "")}>
        <SessionProvider>
          <TauriSessionProvider>
            <QuickAddTaskProvider>
              <PlatformProvider>
                <QueryProvider>
                  <TooltipProvider delayDuration={200}>
                    <PopoverProvider>
                      {children}
                    </PopoverProvider>
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
