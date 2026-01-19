"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      gap={8}
      closeButton
      icons={{
        success: <div className="h-3 w-3 rounded-sm bg-[#4ade80] shrink-0 mt-0.5" style={{ boxShadow: "0 0 8px #4ade8050" }} />,
        error: <div className="h-3 w-3 rounded-sm  bg-[#f87171] shrink-0 mt-0.5" style={{ boxShadow: "0 0 8px #f8717150" }} />,
        info: <div className="h-3 w-3 rounded-sm  bg-[#60a5fa] shrink-0 mt-0.5" style={{ boxShadow: "0 0 8px #60a5fa50" }} />,
        warning: <div className="h-3 w-3 rounded-sm  bg-[#fbbf24] shrink-0 mt-0.5" style={{ boxShadow: "0 0 8px #fbbf2450" }} />,
        loading: <div className="h-3 w-3 rounded-sm bg-white/90 shrink-0 my-auto animate-pulse" style={{ boxShadow: "0 0 8px #ffffff50" }} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group relative flex items-start gap-3 rounded-lg bg-[#0a0a0a] px-4 py-3 shadow-xl border border-white/5 min-w-[320px] max-w-[420px] pr-12 transition-all duration-300 ease-in-out",
          title: "text-sm font-medium text-white",
          description: "text-xs text-white/70 mt-1",
          actionButton: "text-xs font-medium text-white hover:text-white/80 transition-colors shrink-0 ml-auto pl-3 border-l border-white/20",
          cancelButton: "text-xs font-medium text-white/60 hover:text-white transition-colors shrink-0 ml-2 pl-3 border-l border-white/20",
          closeButton: "!bg-transparent !border-0 !shadow-none text-white/60 hover:text-white transition-colors absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 before:content-[''] before:absolute before:left-[-12px] before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-px before:bg-white/20",
          success: "flex items-center gap-3",
          error: "flex items-center gap-3",
          info: "flex items-center gap-3",
          warning: "flex items-center gap-3",
          loading: "flex items-center gap-3",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
