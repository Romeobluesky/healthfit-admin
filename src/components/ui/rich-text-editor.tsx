"use client";

import * as React from "react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
}

const BUTTONS: { cmd: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { cmd: "bold", icon: Bold, label: "굵게" },
  { cmd: "italic", icon: Italic, label: "기울임" },
  { cmd: "underline", icon: Underline, label: "밑줄" },
  { cmd: "insertUnorderedList", icon: List, label: "글머리 목록" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "번호 목록" },
];

export function RichTextEditor({ value, onChange, className, minHeight = "6rem", maxHeight = "14rem" }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastValueRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    if (lastValueRef.current !== value) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value || "";
    }
  }, [value]);

  const emit = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  const exec = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    emit();
  };

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30",
        className,
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-input px-2 py-1">
        {BUTTONS.map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emit}
        onBlur={emit}
        role="textbox"
        aria-multiline
        suppressContentEditableWarning
        className="overflow-y-auto px-3 py-2 text-sm outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        style={{ minHeight, maxHeight }}
      />
    </div>
  );
}
