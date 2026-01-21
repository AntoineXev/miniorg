"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { NavButton } from "@/components/ui/nav-button";
import { ArrowLeft, User } from "lucide-react";
import { useTauriSession } from "@/providers/tauri-session";

export default function ProfilePage() {
  const { session } = useTauriSession();
  const router = useRouter();

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
      <Header 
        title="Profil" 
        subtitle="Informations de votre compte"
        backButton={
          <NavButton onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1} />
          </NavButton>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Avatar */}
          <div className="flex justify-center">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-lg"
                width={96}
                height={96}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                <span className="text-3xl font-medium text-primary">
                  {getUserInitials()}
                </span>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informations du profil</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nom complet
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-foreground">
                    {session?.user?.name || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-foreground">
                    {session?.user?.email || "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-muted/30">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-muted-foreground" strokeWidth={1} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Compte Google
                </h4>
                <p className="text-sm text-muted-foreground">
                  Les données de votre profil proviennent de votre compte Google et ne peuvent pas être modifiées ici.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
