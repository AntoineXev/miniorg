"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { NavButton } from "@/components/ui/nav-button";
import { TagList } from "@/components/tags/tag-list";
import { ArrowLeft } from "lucide-react";

export default function TagsSettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-background">
      <Header 
        title="Contexts & Channels" 
        subtitle="Organize your tasks with contexts and channels"
        backButton={
          <NavButton onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1} />
          </NavButton>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <TagList />
        </div>
      </div>
    </div>
  );
}
