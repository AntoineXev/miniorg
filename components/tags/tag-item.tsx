"use client";

import { useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/button-group";
import { TagDisplay } from "@/components/tags/tag-display";
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
    <button
      onClick={() => onEdit(tag)}
      type="button"
      className={cn(
        "w-full group flex items-center gap-3 py-2 px-3 hover:bg-muted/10 transition-colors",
        isChild && "pl-10"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <TagDisplay 
        tag={tag} 
        size="base"
        className="flex-1 text-sm font-medium"
      />
      
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
      
      <div className={cn("ml-2", !showActions && "opacity-0")}>
        <ButtonGroup>
          {!isChild && onCreateChild && (
            <ButtonGroupItem
              onClick={() => onCreateChild(tag.id)}
              title="Add channel"
            >
              <Plus className="h-3 w-3" strokeWidth={1} />
            </ButtonGroupItem>
          )}
          <ButtonGroupItem
            onClick={() => onEdit(tag)}
            title="Edit"
          >
            <Edit2 className="h-3 w-3" strokeWidth={1} />
          </ButtonGroupItem>
          <ButtonGroupItem
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1} />
          </ButtonGroupItem>
        </ButtonGroup>
      </div>
    </button>
  );
}
