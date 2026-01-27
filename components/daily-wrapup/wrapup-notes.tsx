"use client";

import { useState, useEffect } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

type WrapupNotesProps = {
  initialNotes?: string | null;
  onChange: (notes: string) => void;
  readOnly?: boolean;
};

export function WrapupNotes({ initialNotes, onChange, readOnly = false }: WrapupNotesProps) {
  const [notes, setNotes] = useState(initialNotes || "");

  useEffect(() => {
    setNotes(initialNotes || "");
  }, [initialNotes]);

  const handleChange = (content: string) => {
    setNotes(content);
    onChange(content);
  };

  return (
    <div className="h-full flex flex-col px-2">
      <h3 className="text-base font-semibold">Notes</h3>
      <p className="text-xs font-light italic pt-1 text-muted-foreground mb-4">
        Any thoughts about today?
      </p>

      <div className="flex-1">
        <RichTextEditor
          content={notes}
          onChange={handleChange}
          placeholder="Enter your daily wrap-up notes here..."
          readOnly={readOnly}
          minHeight="120px"
        />
      </div>
    </div>
  );
}
