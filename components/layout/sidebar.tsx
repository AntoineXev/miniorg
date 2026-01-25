"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, SquareKanban, User, ChevronsLeft, ChevronsRight, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/providers/platform-provider";
import { useCallback, useRef, type MouseEvent } from "react";
import { useTauriSession } from "@/providers/tauri-session";

const mainNavigation = [
  { name: "Calendar", href: "/calendar", icon: SquareKanban },
  { name: "Backlog", href: "/backlog", icon: ClipboardList },
];

const ritualsNavigation = [
  { name: "Daily Planning", href: "/daily-planning", icon: Sun },
];

type SidebarProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useTauriSession();
  const { isTauri } = usePlatform();

  return (
    <div 
      data-tauri-drag-region={true}
      className={cn(
        "flex h-full flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-52"
      )}
    >
      <div className={cn(
        "flex items-center justify-between",
        isCollapsed ? "p-4" : "p-6"
      )}>
        {!isCollapsed && (
          <div className={cn("flex items-center gap-2.5", isTauri && "-ml-2")}>
            <h1 className="text-xl font-medium tracking-tight">MiniOrg.</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          data-tauri-drag-region="false"
          className={cn(
            "h-8 w-8 p-0 shrink-0",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight strokeWidth={1} className="h-4 w-4" />
          ) : (
            <ChevronsLeft strokeWidth={1} className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              data-tauri-drag-region="false"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-200/70",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={1}/>
              {!isCollapsed && item.name}
            </Link>
          );
        })}

        {/* Rituals Section */}
        <div className="pt-4 mt-4">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Rituals
            </span>
          )}
          <div className="mt-2 space-y-1">
            {ritualsNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-tauri-drag-region="false"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:bg-gray-200/70",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" strokeWidth={1}/>
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* User section at the bottom - Settings link */}
      <div className="px-3 pb-4">
        {session?.user && (
          <Link
            href="/settings"
            data-tauri-drag-region="false"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:bg-gray-200/70",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? session.user.name || "Settings" : undefined}
          >
            <User className="h-5 w-5 shrink-0" strokeWidth={1}/>
            {!isCollapsed && (
              <span className="truncate">
                {session.user.name || session.user.email?.split('@')[0]}
              </span>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}
