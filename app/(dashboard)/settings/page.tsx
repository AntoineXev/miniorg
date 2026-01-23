"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { User, Calendar, Hash, LogOut, ChevronRight } from "lucide-react";
import { useTauriSession } from "@/providers/tauri-session";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  showChevron?: boolean;
};

function SettingsSection({ icon, title, subtitle, onClick, showChevron = true }: SettingsSectionProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {showChevron && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const { session, logout } = useTauriSession();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!session?.user?.name) {
      return session?.user?.email?.charAt(0).toUpperCase() || "U";
    }
    const names = session.user.name.split(" ");
    if (names.length >= 2) {
      return names[0].charAt(0) + names[1].charAt(0);
    }
    return names[0].charAt(0);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Header title="Paramètres" subtitle="Gérer votre compte et vos préférences" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Profile Section */}
          <Card className="overflow-hidden">
            <SettingsSection
              icon={
                session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-12 w-12 rounded-full object-cover"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {getUserInitials()}
                    </span>
                  </div>
                )
              }
              title={session?.user?.name || "Utilisateur"}
              subtitle={session?.user?.email ?? undefined}
              onClick={() => router.push("/settings/profile")}
            />
          </Card>

          {/* Settings Sections */}
          <Card className="overflow-hidden divide-y">
            <SettingsSection
              icon={<Calendar className="h-5 w-5 text-muted-foreground" strokeWidth={1} />}
              title="Calendriers"
              subtitle="Gérer vos connexions calendrier"
              onClick={() => router.push("/settings/calendars")}
            />
            <SettingsSection
              icon={<Hash className="h-5 w-5 text-muted-foreground" strokeWidth={1} />}
              title="Tags"
              subtitle="Organiser vos tâches"
              onClick={() => router.push("/settings/tags")}
            />
          </Card>

          {/* Logout Section */}
          <Card className="overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Se déconnecter</span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
