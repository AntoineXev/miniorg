"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const isSubmitting = createTag.isPending || updateTag.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Create"} {isContext ? "Context" : "Channel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isContext ? "Work, Personal..." : "Project name..."}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker selectedColor={color} onSelectColor={setColor} />
          </div>

          {isContext && (
            <div className="space-y-4">
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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
