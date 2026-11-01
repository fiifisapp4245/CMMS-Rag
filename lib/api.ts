import { runMock, starters } from "@/lib/mock";
import type { ConversationSummary, FinalPayload, Health, Rating, StageName, ToolCall } from "@/lib/types";

const HISTORY_KEY = "cmms-demo-history";

// History stays in the viewer's browser, because the demo has no database.
function readMessages(): { payload: FinalPayload; created_utc: string }[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveMessage(payload: FinalPayload) {
  try {
    const messages = [...readMessages(), { payload, created_utc: new Date().toISOString() }];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  } catch {
    // The answer still shows; it just will not appear under past questions.
  }
}

export const getHealth = async (): Promise<Health> => ({
  mode: "mock",
  profile: "demo",
});

export const getStarters = async () => starters();

export const getHistory = async (): Promise<ConversationSummary[]> => {
  const conversations = new Map<string, ConversationSummary>();
  for (const { payload, created_utc } of readMessages()) {
    const existing = conversations.get(payload.conversation_id);
    conversations.set(payload.conversation_id, {
      id: payload.conversation_id,
      title: existing?.title ?? payload.question,
      updated_utc: created_utc,
      message_count: (existing?.message_count ?? 0) + 1,
    });
  }
  return [...conversations.values()].sort((a, b) => b.updated_utc.localeCompare(a.updated_utc));
};

export const getConversation = async (id: string): Promise<FinalPayload[]> =>
  readMessages()
    .map((message) => message.payload)
    .filter((payload) => payload.conversation_id === id);

export async function sendFeedback(messageId: string, rating: Rating, comment: string) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId, rating, comment: comment.trim() || null }),
  });
  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Not signed in.");
  }
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  return response.json() as Promise<{ ok: boolean }>;
}

export interface AskHandlers {
  onStage: (stage: StageName, status: "started" | "done") => void;
  onToolCall: (call: ToolCall) => void;
  onFinal: (payload: FinalPayload) => void;
  onError: (message: string) => void;
}

export async function ask(question: string, conversationId: string | null, handlers: AskHandlers) {
  try {
    const payload = await runMock(question, conversationId, handlers);
    saveMessage(payload);
    handlers.onFinal(payload);
  } catch (error) {
    handlers.onError(error instanceof Error ? error.message : "The demo answer failed.");
  }
}
