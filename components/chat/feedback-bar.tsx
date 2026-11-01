"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendFeedback } from "@/lib/api";
import type { Rating } from "@/lib/types";

const OPTIONS: { rating: Rating; label: string }[] = [
  { rating: "correct", label: "Correct" },
  { rating: "partly", label: "Partly" },
  { rating: "wrong", label: "Wrong" },
];

export function FeedbackBar({ messageId }: { messageId: string }) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating) return;
    setState("sending");
    try {
      await sendFeedback(messageId, rating, comment);
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    const label = OPTIONS.find((o) => o.rating === rating)?.label;
    return <p className="text-xs text-muted-foreground">Feedback sent: {label}.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Rate this answer" className="flex items-center gap-1">
        {OPTIONS.map((option) => (
          <Button
            key={option.rating}
            size="sm"
            variant={rating === option.rating ? "secondary" : "ghost"}
            aria-pressed={rating === option.rating}
            onClick={() => setRating(option.rating)}
            className="h-7 px-2.5 text-xs text-muted-foreground aria-pressed:text-foreground"
          >
            {option.label}
          </Button>
        ))}
      </div>
      {rating && (
        <form onSubmit={submit} className="flex max-w-md items-center gap-2">
          <Input
            value={comment}
            maxLength={2000}
            placeholder="Add a comment (optional)"
            aria-label="Comment on this answer"
            onChange={(e) => setComment(e.target.value)}
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={state === "sending"} className="h-8">
            Send
          </Button>
        </form>
      )}
      {state === "failed" && (
        <p role="alert" className="text-xs text-destructive">
          Could not send your feedback. Try again.
        </p>
      )}
    </div>
  );
}
