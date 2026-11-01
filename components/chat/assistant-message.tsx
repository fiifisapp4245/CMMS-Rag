"use client";

import { PanelRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Turn } from "@/lib/types";
import { parseAnswer } from "./citations";
import { FeedbackBar } from "./feedback-bar";
import { StageIndicator } from "./stage-indicator";

export function CitationChip({
  id,
  invalid,
  active,
  onClick,
}: {
  id: string;
  invalid: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={invalid ? `Citation ${id}, not found in the log` : `Show evidence for ${id}`}
      className={cn(
        "mx-0.5 inline-flex h-5 translate-y-[-1px] items-center rounded-md border px-1.5 align-middle font-mono text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        invalid
          ? "border-dashed border-destructive/60 text-destructive hover:bg-destructive/10"
          : "border-brand/40 text-brand hover:bg-brand/10",
        active && (invalid ? "bg-destructive/10" : "bg-brand/15"),
      )}
    >
      {id}
    </button>
  );
}

export function AssistantMessage({
  turn,
  activeCitation,
  onOpenEvidence,
  onRetry,
}: {
  turn: Turn;
  activeCitation: string | null;
  onOpenEvidence: (recordId: string | null) => void;
  onRetry: () => void;
}) {
  if (turn.status === "streaming") return <StageIndicator turn={turn} />;

  if (turn.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-2 text-sm">
        <p className="text-destructive">{turn.error}</p>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  const payload = turn.payload!;
  const claims = payload.sentences.filter((s) => s.verdict !== "NO_CLAIM");
  const supported = claims.filter((s) => s.verdict === "SUPPORTED").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[15px] leading-7 whitespace-pre-wrap">
        {parseAnswer(payload.answer).map((part, index) =>
          part.type === "text" ? (
            <span key={index}>{part.text}</span>
          ) : (
            <CitationChip
              key={index}
              id={part.id}
              invalid={payload.invalid_ids.includes(part.id)}
              active={activeCitation === part.id}
              onClick={() => onOpenEvidence(part.id)}
            />
          ),
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenEvidence(null)}
          className="-ml-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        >
          <PanelRight className="size-3.5" />
          Evidence
        </Button>
        {claims.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {supported} of {claims.length} claims supported
          </span>
        )}
        {payload.mock && (
          <Badge variant="outline" className="text-[11px]">
            Mock data
          </Badge>
        )}
      </div>
      <FeedbackBar messageId={payload.message_id} />
    </div>
  );
}
