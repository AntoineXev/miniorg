"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, Calendar, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Backlog", href: "/backlog", icon: ListTodo },
];

type SidebarProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return (
    <div 
      className={cn(
        "flex h-full flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn(
        "flex items-center justify-between",
        isCollapsed ? "p-4" : "p-6"
      )}>
        {!isCollapsed && (
          <h1 className="text-2xl font-semibold tracking-tight">MiniOrg</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "h-8 w-8 p-0 shrink-0",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-200/70",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* User section at the bottom */}
      <div className="p-4">
        {session?.user && (
          <div className={cn(
            "flex items-center gap-2",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user.name || session.user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 w-8 p-0 shrink-0"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
