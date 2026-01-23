"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTagsQuery } from "@/lib/api/queries/tags";
import { usePlatform } from "@/lib/hooks/use-platform";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { TagDisplay } from "./tag-display";

type TagSelectorProps = {
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
  size?: "small" | "base";
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  showNoTagOption?: boolean;
};

export function TagSelector({
  selectedTag,
  onSelectTag,
  size = "base",
  className,
  placeholder = "Add tag",
  disabled = false,
  showNoTagOption = false,
}: TagSelectorProps) {
  const { data: tags } = useTagsQuery();
  const { isTauri } = usePlatform();
  const router = useRouter();

  // Flatten tags with hierarchy: parent followed by its children
  const flatTags = useMemo(() => {
    if (!tags) return [];
    
    const result: Tag[] = [];
    
    tags.forEach((tag) => {
      if (!tag.parentId) {
        // Add parent
        result.push(tag);
        
        // Add children right after parent
        if (tag.children) {
          tag.children.forEach((child) => {
            result.push(child);
          });
        }
      }
    });
    
    return result;
  }, [tags]);

  const handleChange = async (value: string) => {
    if (value === "no-tag") {
      onSelectTag(null);
    } else if (value === "manage-tags") {
      // Navigate to tag management page
      if (isTauri) {
        // Check window label directly since it might not be ready in context
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const currentLabel = getCurrentWindow().label;

        if (currentLabel === "quick-add") {
          // From quick-add window: focus main window and navigate
          try {
            const { invoke } = await import("@tauri-apps/api/core");
            await invoke("focus_main_window", { path: "/settings/tags" });
          } catch (error) {
            console.error("Failed to focus main window:", error);
          }
        } else {
          // Main Tauri window: navigate directly
          router.push("/settings/tags");
        }
      } else {
        // Web: navigate directly
        router.push("/settings/tags");
      }
    } else {
      const tag = flatTags.find(t => t.id === value);
      onSelectTag(tag || null);
    }
  };

  return (
    <div className={cn(className)}>
      <Select 
        value={selectedTag?.id || (showNoTagOption ? "no-tag" : "")} 
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="p-0 text-muted-foreground h-auto focus:ring-ring-0 focus:ring-offset-0 hover:text-foreground hover:bg-transparent bg-transparent text-sm border-0 focus:ring-0 w-auto">
          <SelectValue>
            <TagDisplay tag={selectedTag} size={size} placeholder={placeholder} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showNoTagOption && (
            <SelectItem value="no-tag" hideIndicator>
              <TagDisplay className="text-muted-foreground" tag={null} placeholder="No tag" />
            </SelectItem>
          )}
          {flatTags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id} hideIndicator>
              <TagDisplay className={cn(tag.parentId && 'ml-4')} tag={tag} />
            </SelectItem>
          ))}
          <SelectItem value="manage-tags" hideIndicator>
            <span className="flex items-center gap-2 text-muted-foreground/80 text-xs border-t border-border/40 pt-2">
              <Settings className="h-3.5 w-3.5" />
              Gérer mes tags
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
