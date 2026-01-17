"use client";

import { ReactNode } from "react";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function Header({ title, subtitle, actions, children }: HeaderProps) {
  return (
    <header className="backdrop-blur-md sticky top-0 z-10 border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {title && (
              <div>
                <h1 className=" font-semibold tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
