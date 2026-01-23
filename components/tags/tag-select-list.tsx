"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { TaskTagBadge } from "@/components/tags/task-tag-badge";
import { useTagsQuery } from "@/lib/api/queries/tags";
import { usePlatform } from "@/lib/hooks/use-platform";
import { X, Settings } from "lucide-react";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type TagSelectListProps = {
  onSelectTag: (tag: Tag | null) => void;
  selectedTagId?: string | null;
  searchQuery?: string;
  selectedIndex?: number;
  showNoTagOption?: boolean;
  showManageTagsOption?: boolean;
  manageTagsHighlighted?: boolean;
  onManageTagsClick?: () => void;
  size?: "small" | "base";
  className?: string;
  showKeyboardHighlight?: boolean;
};

export function TagSelectList({
  onSelectTag,
  selectedTagId,
  searchQuery = "",
  selectedIndex = 0,
  showNoTagOption = false,
  showManageTagsOption = false,
  manageTagsHighlighted = false,
  onManageTagsClick,
  size = "base",
  className,
  showKeyboardHighlight = false,
}: TagSelectListProps) {
  const { data: tags } = useTagsQuery();
  const { isTauri } = usePlatform();
  const router = useRouter();

  const handleManageTagsClick = async () => {
    if (onManageTagsClick) {
      onManageTagsClick();
    }

    if (isTauri) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const currentLabel = getCurrentWindow().label;

      if (currentLabel === "quick-add") {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("focus_main_window", { path: "/settings/tags" });
        } catch (error) {
          console.error("Failed to focus main window:", error);
        }
      } else {
        router.push("/settings/tags");
      }
    } else {
      router.push("/settings/tags");
    }
  };

  // Flatten tags with hierarchy for display
  const flatTags = useMemo(() => {
    if (!tags) return [];
    
    const result: Array<Tag & { displayName: string }> = [];
    
    tags.forEach((tag) => {
      if (!tag.parentId) {
        // Add context
        result.push({ ...tag, displayName: tag.name });
        
        // Add children with parent name
        tag.children?.forEach((child) => {
          result.push({ ...child, displayName: `${tag.name} > ${child.name}` });
        });
      }
    });
    
    return result;
  }, [tags]);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    return flatTags.filter((tag) => {
      const alreadySelected = selectedTagId === tag.id;
      if (alreadySelected) return false;
      
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return tag.name.toLowerCase().includes(query) ||
             tag.displayName.toLowerCase().includes(query);
    });
  }, [flatTags, searchQuery, selectedTagId]);

  const hasNoResults = filteredTags.length === 0 && !showNoTagOption;

  if (hasNoResults) {
    return (
      <div className={cn("py-2 px-3 text-sm text-muted-foreground", className)}>
        No tags found
      </div>
    );
  }

  return (
    <div className={cn("p-1", className)}>
      {showNoTagOption && selectedTagId && (
        <button
          key="no-tag"
          type="button"
          onClick={() => onSelectTag(null)}
          className="w-full flex items-center gap-2 p-2 text-left rounded-md hover:bg-muted/10 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
          <span className="text-xs text-muted-foreground/70">No tag</span>
        </button>
      )}
      {filteredTags.map((tag, index) => {
        const isKeyboardSelected = showKeyboardHighlight && index === selectedIndex;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onSelectTag(tag)}
            data-index={index}
            className={cn(
              "w-full flex items-center gap-2 p-2 text-left rounded-md hover:bg-muted/10 transition-colors",
              isKeyboardSelected && "bg-muted/20"
            )}
          >
            <TaskTagBadge
              tag={tag}
              size={size}
              className={cn(tag.parentId && 'ml-4')}
              textClassName={cn('text-muted-foreground/70', isKeyboardSelected && 'text-muted-foreground')}
            />
          </button>
        );
      })}
      {showManageTagsOption && (
        <>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={handleManageTagsClick}
            data-index="manage-tags"
            className={cn(
              "w-full flex items-center gap-2 p-2 text-left rounded-md hover:bg-muted/10 transition-colors text-muted-foreground",
              manageTagsHighlighted && "bg-muted/20"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="text-xs">Gérer mes tags</span>
          </button>
        </>
      )}
    </div>
  );
}
