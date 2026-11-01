"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AppMark } from "./app-mark";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

export function EmptyState({
  starters,
  onPick,
  composer,
}: {
  starters: string[];
  onPick: (question: string) => void;
  composer: React.ReactNode;
}) {
  // Set after mount, because the server does not know the engineer's local time.
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);

  return (
    <div className="flex min-h-full flex-col justify-center py-8">
      <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6">
        <AppMark className="size-11 rounded-xl" />
        <h1 className="mt-5 text-3xl font-medium tracking-tight sm:text-4xl">
          <span className={greeting ? undefined : "invisible"}>{greeting ?? "Good morning."}</span> Where should we
          begin?
        </h1>
      </div>
      <div className="mt-7">{composer}</div>
      <ul className="mx-auto mt-3 w-full max-w-[720px] px-4 sm:px-6">
        {starters.map((starter) => (
          <li key={starter}>
            <button
              onClick={() => onPick(starter)}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ArrowRight className="size-4 shrink-0 opacity-60" aria-hidden />
              {starter}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
