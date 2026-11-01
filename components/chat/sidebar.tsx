"use client";

import { PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppMark } from "./app-mark";
import type { ConversationSummary } from "@/lib/types";

export function SidebarContent({
  conversations,
  activeId,
  historyError,
  onNewChat,
  onSelect,
  onCollapse,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  historyError: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <span className="flex items-center gap-2.5 text-[15px] font-medium">
          <AppMark className="size-7" />
          CMMS Assistant
        </span>
        {onCollapse && (
          <Button size="icon" variant="ghost" aria-label="Collapse sidebar" onClick={onCollapse} className="size-7">
            <PanelLeft className="size-4" />
          </Button>
        )}
      </div>
      <div className="px-2 pb-2">
        <Button
          variant="secondary"
          onClick={onNewChat}
          className="h-10 w-full justify-start gap-2.5 rounded-lg bg-sidebar-accent px-3 text-[15px] font-normal hover:bg-sidebar-accent/70"
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>
      <nav aria-label="Past questions" className="min-h-0 flex-1 overflow-y-auto px-2 pt-3 pb-3">
        <h2 className="px-3 pb-2 text-xs text-muted-foreground">Past questions</h2>
        {historyError && <p className="px-3 text-xs text-destructive">Could not load past questions.</p>}
        {!historyError && conversations.length === 0 && (
          <p className="px-3 text-xs text-muted-foreground">Your questions will appear here.</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                onClick={() => onSelect(conversation.id)}
                aria-current={conversation.id === activeId ? "true" : undefined}
                title={conversation.title}
                className={cn(
                  "w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  conversation.id === activeId && "bg-sidebar-accent",
                )}
              >
                {conversation.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
