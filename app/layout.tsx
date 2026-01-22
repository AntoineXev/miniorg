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

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
