import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex items-center justify-center rounded-lg bg-brand text-brand-foreground", className)}
    >
      <Wrench className="size-[55%]" strokeWidth={2.5} />
    </span>
  );
}
