"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type RichTextEditorProps = {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  className,
  minHeight = "150px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm text-sm font-light dark:prose-invert max-w-none focus:outline-none",
          "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
          readOnly && "cursor-default opacity-70"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Bubble Menu - appears on text selection */}
      {!readOnly && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 150 }}
          className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-zinc-200 transition-colors",
              editor.isActive("bold") && "bg-muted text-foreground"
            )}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-zinc-200 transition-colors",
              editor.isActive("italic") && "bg-muted text-foreground"
            )}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded hover:bg-zinc-200 transition-colors",
              editor.isActive("strike") && "bg-muted text-foreground"
            )}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </BubbleMenu>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Placeholder styles */}
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .is-editor-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
