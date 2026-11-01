export type StageName = "rewriting" | "retrieving" | "answering" | "checking";
export type Verdict = "SUPPORTED" | "PARTLY" | "NOT_SUPPORTED" | "NO_CLAIM";
export type Rating = "correct" | "partly" | "wrong";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface Sentence {
  text: string;
  ids: string[];
  verdict: Verdict;
  reason: string;
}

export type LogRecord = { id: string } & Record<string, unknown>;

export interface FinalPayload {
  message_id: string;
  conversation_id: string;
  question: string;
  answer: string;
  cited_ids: string[];
  invalid_ids: string[];
  records: LogRecord[];
  tool_calls: ToolCall[];
  sentences: Sentence[];
  model: {
    profile: string;
    requested: Record<string, string>;
    returned: Record<string, string | null>;
    provider: string | null;
  };
  timings_ms: Record<string, number>;
  mock: boolean;
}

export interface Turn {
  key: string;
  question: string;
  status: "streaming" | "done" | "error";
  currentStage: StageName | null;
  doneStages: StageName[];
  toolCalls: ToolCall[];
  payload?: FinalPayload;
  error?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updated_utc: string;
  message_count: number;
}

export interface Health {
  mode: "mock" | "live";
  profile: string;
}
