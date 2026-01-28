"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
};

// Lazy load the actual editor to keep it out of server bundle
const TiptapEditor = dynamic(
  () => import("./tiptap-editor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-muted rounded h-[60px]" />
    ),
  }
);

export function RichTextEditor(props: RichTextEditorProps) {
  return <TiptapEditor {...props} />;
}
