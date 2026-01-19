import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/providers/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider delayDuration={200}>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
