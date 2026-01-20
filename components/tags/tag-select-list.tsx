"use client";

import { useMemo } from "react";
import { TaskTagBadge } from "@/components/tags/task-tag-badge";
import { useTagsQuery } from "@/lib/api/queries/tags";
import { X } from "lucide-react";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type TagSelectListProps = {
  onSelectTag: (tag: Tag | null) => void;
  selectedTagId?: string | null;
  searchQuery?: string;
  selectedIndex?: number;
  showNoTagOption?: boolean;
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
  size = "base",
  className,
  showKeyboardHighlight = false,
}: TagSelectListProps) {
  const { data: tags } = useTagsQuery();

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
    </div>
  );
}
