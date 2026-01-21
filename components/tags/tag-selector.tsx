"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTagsQuery } from "@/lib/api/queries/tags";
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

  const handleChange = (value: string) => {
    if (value === "no-tag") {
      onSelectTag(null);
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
        </SelectContent>
      </Select>
    </div>
  );
}
