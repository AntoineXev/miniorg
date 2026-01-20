"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TagItem } from "./tag-item";
import { TagDialog } from "./tag-dialog";
import { useTagsQuery } from "@/lib/api/queries/tags";
import { Loader2 } from "lucide-react";
import type { Tag } from "@/lib/api/types";

export function TagList() {
  const { data: tags, isLoading } = useTagsQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"context" | "channel">("context");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  const handleCreateContext = () => {
    setEditingTag(null);
    setParentId(null);
    setDialogMode("context");
    setDialogOpen(true);
  };

  const handleCreateChannel = (parentTagId: string) => {
    setEditingTag(null);
    setParentId(parentTagId);
    setDialogMode("channel");
    setDialogOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setParentId(tag.parentId || null);
    setDialogMode(tag.parentId ? "channel" : "context");
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setParentId(null);
  };

  // Filter to get only top-level tags (contexts)
  const contexts = tags?.filter((tag) => !tag.parentId) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex gap-3">
          <Button onClick={handleCreateContext}>Create Context</Button>
        </div>

        {contexts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No contexts yet. Create your first context to organize your tasks.
            </p>
          </Card>
        ) : (
          <Card className="divide-y">
            {contexts.map((context) => (
              <div key={context.id}>
                <TagItem
                  tag={context}
                  onEdit={handleEdit}
                  onCreateChild={handleCreateChannel}
                />
                {context.children?.map((child) => (
                  <TagItem
                    key={child.id}
                    tag={child}
                    isChild
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            ))}
          </Card>
        )}
      </div>

      <TagDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        tag={editingTag}
        parentId={parentId}
        mode={dialogMode}
      />
    </>
  );
}
