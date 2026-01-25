"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHighlightQuery } from "@/lib/api/queries/tasks";
import { useUpsertHighlightMutation } from "@/lib/api/mutations/tasks";
import { cn } from "@/lib/utils";

type HighlightInputProps = {
  date: Date;
  onNext?: () => void;
};

export function HighlightInput({ date, onNext }: HighlightInputProps) {
  const { data: highlight, isLoading } = useHighlightQuery(date);
  const upsertHighlight = useUpsertHighlightMutation(date);
  const [title, setTitle] = useState("");

  // Pre-fill input with existing highlight
  useEffect(() => {
    if (highlight?.title) {
      setTitle(highlight.title);
    } else {
      setTitle("");
    }
  }, [highlight?.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Save the highlight
    await upsertHighlight.mutateAsync(title.trim());

    // Call onNext callback if provided
    if (onNext) {
      onNext();
    }
  };

  const isCompleted = highlight?.status === "done";

  return (
    <div className="pb-6 pt-6">
      <div className="flex flex-col items-start gap-2 mb-3">
        <h2 className="text-md font-semibold">Highlight of the Day</h2>
        <span className="text-xs text-muted-foreground">
          Enter your highlight of the day. What do you want to accomplish the most today?
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-col">
        <textarea
          placeholder={
            isLoading ? "Loading..." : "What's the one thing you want to accomplish today?"
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading || upsertHighlight.isPending}
          className={cn(
            "flex-1 w-full min-h-[80px] px-3 py-2 text-sm rounded-sm bg-card border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring",
            isCompleted && "line-through text-muted-foreground"
          )}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!title.trim() || isLoading || upsertHighlight.isPending}
          className="self-end bg-card w-full font-medium"
        >
          {upsertHighlight.isPending ? "Saving..." : "Next"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>

      {isCompleted && (
        <div className="flex items-center gap-1.5 mt-3 text-green-600">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Completed!</span>
        </div>
      )}
    </div>
  );
}
