"use client";

import { useState } from "react";
import { Hash, Trash2, Edit2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteTagMutation } from "@/lib/api/mutations/tags";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type TagItemProps = {
  tag: Tag;
  isChild?: boolean;
  onEdit: (tag: Tag) => void;
  onCreateChild?: (parentId: string) => void;
};

export function TagItem({ tag, isChild = false, onEdit, onCreateChild }: TagItemProps) {
  const [showActions, setShowActions] = useState(false);
  const deleteTag = useDeleteTagMutation();

  const handleDelete = async () => {
    if (confirm(`Delete "${tag.name}"? This will also delete all sub-channels.`)) {
      await deleteTag.mutateAsync(tag.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-2 px-3 hover:bg-muted/50 transition-colors",
        isChild && "pl-10"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      
      <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1} />
      
      <span className="flex-1 text-sm font-medium">{tag.name}</span>
      
      <div className="flex items-center gap-1">
        {tag.isPersonal && (
          <Badge variant="secondary" className="text-xs">
            personal
          </Badge>
        )}
        {tag.isDefault && (
          <Badge variant="secondary" className="text-xs">
            default
          </Badge>
        )}
      </div>
      
      <div className={cn("flex items-center gap-1 ml-2", !showActions && "opacity-0")}>
        {!isChild && onCreateChild && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onCreateChild(tag.id)}
          >
            <Plus className="h-3 w-3" strokeWidth={1} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => onEdit(tag)}
        >
          <Edit2 className="h-3 w-3" strokeWidth={1} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" strokeWidth={1} />
        </Button>
      </div>
    </div>
  );
}
