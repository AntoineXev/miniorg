import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MiniOrg - Life Planner",
  description: "A minimal, clean life planner for modern professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
