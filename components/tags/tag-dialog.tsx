"use client";

import { useState, useEffect } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "./color-picker";
import { useCreateTagMutation, useUpdateTagMutation } from "@/lib/api/mutations/tags";
import type { Tag } from "@/lib/api/types";

type TagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
  parentId?: string | null;
  mode: "context" | "channel";
};

export function TagDialog({ open, onOpenChange, tag, parentId, mode }: TagDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#E17C4F");
  const [isPersonal, setIsPersonal] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const createTag = useCreateTagMutation();
  const updateTag = useUpdateTagMutation();

  const isEditing = !!tag;
  const isContext = mode === "context" || !parentId;

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
      setIsPersonal(tag.isPersonal);
      setIsDefault(tag.isDefault);
    } else {
      setName("");
      setColor("#E17C4F");
      setIsPersonal(false);
      setIsDefault(false);
    }
  }, [tag]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      color,
      isPersonal: isContext ? isPersonal : false,
      isDefault: isContext ? isDefault : false,
      parentId: parentId || null,
    };

    if (isEditing) {
      await updateTag.mutateAsync({ ...data, id: tag.id });
    } else {
      await createTag.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSubmitting = createTag.isPending || updateTag.isPending;

  return (
    <UnifiedModal
      open={open}
      onOpenChange={onOpenChange}
      headerValue={name}
      headerPlaceholder={isContext ? "Work, Personal..." : "Project name..."}
      onHeaderChange={setName}
      onKeyDown={handleKeyDown}
      showMoreExpanded={true}
      maxWidth="sm:max-w-[500px]"
      showMoreContent={
        <>
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker selectedColor={color} onSelectColor={setColor} />
          </div>

          {isContext && (
            <div className="space-y-4 pt-2">
              <Label 
                htmlFor="personal-switch" 
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-medium">Personal context</div>
                  <p className="text-xs text-muted-foreground font-normal">
                    Categorize tasks in this context as personal.
                  </p>
                </div>
                <Switch
                  id="personal-switch"
                  checked={isPersonal}
                  onCheckedChange={setIsPersonal}
                />
              </Label>

              <Label 
                htmlFor="default-switch" 
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-medium">Default channel</div>
                  <p className="text-xs text-muted-foreground font-normal">
                    Assign new tasks to this context by default.
                  </p>
                </div>
                <Switch
                  id="default-switch"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </Label>
            </div>
          )}
        </>
      }
      actionButtons={
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || isSubmitting}
        >
          {isSubmitting ? "Saving..." : (isEditing ? "Save" : "Create")}
        </Button>
      }
      keyboardHints={
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted">Enter</kbd>
          <span className="ml-1">to save</span>
        </span>
      }
    />
  );
}
