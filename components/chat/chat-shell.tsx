"use client";

import { Moon, PanelLeft, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ask, getConversation, getHealth, getHistory, getStarters } from "@/lib/api";
import type { ConversationSummary, FinalPayload, Health, Turn } from "@/lib/types";
import { AssistantMessage } from "./assistant-message";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { EvidenceContent, EvidenceHeader } from "./evidence-panel";
import { SidebarContent } from "./sidebar";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function turnFromPayload(payload: FinalPayload): Turn {
  return {
    key: payload.message_id,
    question: payload.question,
    status: "done",
    currentStage: null,
    doneStages: [],
    toolCalls: payload.tool_calls,
    payload,
  };
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="size-7"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function ChatShell() {
  const isDesktop = useIsDesktop();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [starters, setStarters] = useState<string[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [evidence, setEvidence] = useState<{ messageId: string; citation: string | null } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const requestToken = useRef(0);

  const refreshHistory = useCallback(() => {
    getHistory()
      .then((list) => {
        setConversations(list);
        setHistoryError(false);
      })
      .catch(() => setHistoryError(true));
  }, []);

  useEffect(() => {
    refreshHistory();
    getStarters().then(setStarters).catch(() => setStarters([]));
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, [refreshHistory]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  const busy = turns.some((turn) => turn.status === "streaming");

  const send = useCallback(
    (question: string) => {
      const key = crypto.randomUUID();
      const token = requestToken.current;
      const update = (change: (turn: Turn) => Turn) => {
        if (token !== requestToken.current) return;
        setTurns((all) => all.map((turn) => (turn.key === key ? change(turn) : turn)));
      };
      setTurns((all) => [
        ...all,
        { key, question, status: "streaming", currentStage: null, doneStages: [], toolCalls: [] },
      ]);
      ask(question, conversationId, {
        onStage: (stage, status) =>
          update((turn) =>
            status === "started"
              ? { ...turn, currentStage: stage }
              : { ...turn, doneStages: [...turn.doneStages, stage] },
          ),
        onToolCall: (call) => update((turn) => ({ ...turn, toolCalls: [...turn.toolCalls, call] })),
        onFinal: (payload) => {
          update((turn) => ({ ...turn, status: "done", payload }));
          if (token === requestToken.current) setConversationId(payload.conversation_id);
          refreshHistory();
        },
        onError: (message) => update((turn) => ({ ...turn, status: "error", error: message })),
      });
    },
    [conversationId, refreshHistory],
  );

  function newChat() {
    requestToken.current += 1;
    setTurns([]);
    setConversationId(null);
    setEvidence(null);
    setLoadError(null);
    setMobileSidebarOpen(false);
  }

  async function openConversation(id: string) {
    requestToken.current += 1;
    setMobileSidebarOpen(false);
    setEvidence(null);
    setLoadError(null);
    try {
      const messages = await getConversation(id);
      setTurns(messages.map(turnFromPayload));
      setConversationId(id);
    } catch {
      setLoadError("Could not open that conversation.");
    }
  }

  function retry(turn: Turn) {
    setTurns((all) => all.filter((t) => t.key !== turn.key));
    send(turn.question);
  }

  const evidencePayload = evidence
    ? turns.find((turn) => turn.payload?.message_id === evidence.messageId)?.payload
    : undefined;

  const sidebarProps = {
    conversations,
    activeId: conversationId,
    historyError,
    onNewChat: newChat,
    onSelect: openConversation,
  };

  const main = (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-1 px-3">
        {(!isDesktop || !sidebarOpen) && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Open sidebar"
            onClick={() => (isDesktop ? setSidebarOpen(true) : setMobileSidebarOpen(true))}
            className="size-7"
          >
            <PanelLeft className="size-4" />
          </Button>
        )}
        <div className="flex-1" />
        {health?.mode === "mock" && <Badge variant="outline">Mock data</Badge>}
        <ThemeToggle />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {loadError && (
          <p role="alert" className="mx-auto max-w-[720px] px-4 pt-2 text-sm text-destructive">
            {loadError}
          </p>
        )}
        {turns.length === 0 ? (
          <EmptyState starters={starters} onPick={send} composer={<Composer busy={busy} onSend={send} />} />
        ) : (
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 pt-4 pb-8 sm:px-6">
            {turns.map((turn) => (
              <article key={turn.key} className="flex flex-col gap-4">
                <div className="max-w-[85%] self-end rounded-2xl bg-muted px-4 py-2 text-[15px] leading-6 whitespace-pre-wrap">
                  {turn.question}
                </div>
                <AssistantMessage
                  turn={turn}
                  activeCitation={evidence?.messageId === turn.payload?.message_id ? (evidence?.citation ?? null) : null}
                  onOpenEvidence={(citation) =>
                    turn.payload && setEvidence({ messageId: turn.payload.message_id, citation })
                  }
                  onRetry={() => retry(turn)}
                />
              </article>
            ))}
            <div ref={bottom} />
          </div>
        )}
      </main>

      {turns.length > 0 && <Composer busy={busy} onSend={send} />}
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden">
      {isDesktop && sidebarOpen && (
        <aside className="w-[272px] shrink-0 border-r">
          <SidebarContent {...sidebarProps} onCollapse={() => setSidebarOpen(false)} />
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {isDesktop ? (
          // One group always, so opening evidence does not remount the thread or lose a draft.
          <ResizablePanelGroup direction="horizontal" autoSaveId="cmms-evidence">
            <ResizablePanel id="thread" order={1} minSize={35}>
              {main}
            </ResizablePanel>
            {evidencePayload && (
              <>
                <ResizableHandle />
                <ResizablePanel id="evidence" order={2} defaultSize={36} minSize={25} maxSize={60}>
                  <div className="flex h-full flex-col">
                    <EvidenceHeader onClose={() => setEvidence(null)} />
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <EvidenceContent payload={evidencePayload} activeCitation={evidence?.citation ?? null} />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        ) : (
          main
        )}
      </div>

      {!isDesktop && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-72 gap-0 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>
      )}

      {!isDesktop && (
        <Sheet open={Boolean(evidencePayload)} onOpenChange={(open) => !open && setEvidence(null)}>
          <SheetContent side="right" showCloseButton={false} className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
            <SheetTitle className="sr-only">Evidence</SheetTitle>
            <EvidenceHeader onClose={() => setEvidence(null)} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {evidencePayload && (
                <EvidenceContent payload={evidencePayload} activeCitation={evidence?.citation ?? null} />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
