"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function Composer({ busy, onSend }: { busy: boolean; onSend: (question: string) => void }) {
  const [value, setValue] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    if (!busy) textarea.current?.focus();
  }, [busy]);

  function send() {
    const question = value.trim();
    if (!question || busy) return;
    onSend(question);
    setValue("");
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-3 sm:px-6">
      <div className="flex items-end gap-2 rounded-2xl border bg-card p-2.5 shadow-[0_2px_12px_rgb(0_0_0/0.06)] transition-colors focus-within:border-ring dark:shadow-none">
        <textarea
          ref={textarea}
          rows={1}
          value={value}
          maxLength={2000}
          aria-label="Ask a question about the maintenance log"
          placeholder="Ask about the maintenance log"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-base leading-6 outline-none placeholder:text-muted-foreground"
        />
        <Button
          size="icon"
          aria-label="Send"
          disabled={busy || !value.trim()}
          onClick={send}
          className="size-9 shrink-0 rounded-xl"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Each question is answered independently — include the equipment name or tag.
      </p>
    </div>
  );
}
