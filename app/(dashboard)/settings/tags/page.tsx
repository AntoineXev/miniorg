"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { NavButton } from "@/components/ui/nav-button";
import { Card } from "@/components/ui/card";
import { Hash, ArrowLeft, Construction } from "lucide-react";

export default function TagsSettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-background">
      <Header 
        title="Tags" 
        subtitle="Organiser vos tâches"
        backButton={
          <NavButton onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1} />
          </NavButton>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <Construction className="h-12 w-12 text-muted-foreground" strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-semibold mb-3">En construction</h2>
            <p className="text-muted-foreground mb-6">
              La gestion des tags arrive bientôt. Vous pourrez organiser et personnaliser vos tags pour mieux structurer vos tâches.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border">
              <Hash className="h-5 w-5 text-muted-foreground" strokeWidth={1} />
              <span className="text-sm font-medium text-foreground">
                Fonctionnalité à venir
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
