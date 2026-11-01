import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Turn, StageName } from "@/lib/types";

const STEPS: { stage: StageName; label: string }[] = [
  { stage: "rewriting", label: "Understanding" },
  { stage: "retrieving", label: "Searching records" },
  { stage: "answering", label: "Drafting" },
  { stage: "checking", label: "Checking claims" },
];

export function StageIndicator({ turn }: { turn: Turn }) {
  const current = STEPS.find((step) => step.stage === turn.currentStage);
  const lastTool = turn.toolCalls.at(-1)?.name;
  return (
    <div>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {STEPS.map(({ stage, label }) => {
          const done = turn.doneStages.includes(stage);
          const active = turn.currentStage === stage && !done;
          return (
            <li
              key={stage}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5",
                done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/50",
              )}
            >
              {done ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <span
                  aria-hidden
                  className={cn("size-1.5 rounded-full", active ? "animate-pulse bg-brand" : "bg-current opacity-50")}
                />
              )}
              {label}
            </li>
          );
        })}
      </ol>
      {lastTool && turn.currentStage === "answering" && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Used <span className="font-mono">{lastTool}</span>
        </p>
      )}
      <p role="status" className="sr-only">
        {current ? `${current.label}…` : "Starting…"}
      </p>
    </div>
  );
}
