// Canned answers built from invented records. Nothing here comes from a real maintenance log.
import type { FinalPayload, LogRecord, Sentence, StageName, ToolCall } from "@/lib/types";

const DELAY_MS = 600;

const EVENTS: Record<string, LogRecord> = {
  E901: {
    id: "E901", date: "2024-03-11", equipment: "Cooling Water Pump P-114", type: "CM",
    failure_mode: "Mechanical seal leak", root_cause: "Worn seal faces", downtime_h: 6.5,
    action: "Replaced mechanical seal and checked shaft alignment", recurred: "N",
    remarks: "Leak seen at the drive end during routine rounds",
  },
  E902: {
    id: "E902", date: "2024-09-23", equipment: "Cooling Water Pump P-114", type: "CM",
    failure_mode: "Mechanical seal leak", root_cause: "Worn seal faces", downtime_h: 8.0,
    action: "Replaced mechanical seal and flushed the seal chamber", recurred: "Y",
    remarks: "Second seal failure on this pump in 2024",
  },
  E903: {
    id: "E903", date: "2024-12-02", equipment: "Instrument Air Compressor C-310", type: "PdM",
    failure_mode: "High bearing vibration", root_cause: "Bearing wear found in vibration survey", downtime_h: 12.0,
    action: "Replaced drive end bearing and rebalanced coupling", recurred: "N",
    remarks: "Picked up on the monthly vibration route",
  },
  E904: {
    id: "E904", date: "2025-04-14", equipment: "Instrument Air Compressor C-310", type: "PM",
    failure_mode: "Planned service", root_cause: "Scheduled 4000 hour service", downtime_h: 5.0,
    action: "Changed oil and air filters and tested the unloader valve", recurred: "N",
    remarks: "Completed within the planned window",
  },
};

const PM: Record<string, LogRecord> = {
  P901: { id: "P901", year: 2025, month: "January", scheduled: 24, done: 22, rate: 91.7, comment: "Two tasks deferred for spares" },
  P902: { id: "P902", year: 2025, month: "February", scheduled: 20, done: 20, rate: 100.0, comment: "" },
};

interface Fixture {
  answer: string;
  records: LogRecord[];
  tool_calls: ToolCall[];
  sentences: Sentence[];
}

const PUMP_SEAL: Fixture = {
  answer:
    "Cooling Water Pump P-114 had two mechanical seal leaks, both attributed to worn seal faces [E901][E902]. " +
    "The second, in September 2024, is marked as a recurrence [E902]. " +
    "Total downtime across the two events is 14.5 hours [E901][E902]. " +
    "The worn faces probably came from the shaft alignment found during the first repair [E901].",
  records: [EVENTS.E901, EVENTS.E902],
  tool_calls: [
    {
      name: "aggregate",
      arguments: { equipment: "Cooling Water Pump P-114", group_by: "equipment" },
      output: {
        total_matched: 2,
        groups: [{
          group: "Cooling Water Pump P-114", events: 2, downtime_h: 14.5,
          recurred: 1, mttr_h: 7.25, ids: ["E901", "E902"],
        }],
      },
    },
  ],
  sentences: [
    {
      text: "Cooling Water Pump P-114 had two mechanical seal leaks, both attributed to worn seal faces [E901][E902].",
      ids: ["E901", "E902"], verdict: "SUPPORTED", reason: "Both records show this failure mode and root cause.",
    },
    {
      text: "The second, in September 2024, is marked as a recurrence [E902].",
      ids: ["E902"], verdict: "SUPPORTED", reason: "E902 is dated 2024-09-23 with recurred = Y.",
    },
    {
      text: "Total downtime across the two events is 14.5 hours [E901][E902].",
      ids: ["E901", "E902"], verdict: "SUPPORTED", reason: "6.5 + 8.0 = 14.5.",
    },
    {
      text: "The worn faces probably came from the shaft alignment found during the first repair [E901].",
      ids: ["E901"], verdict: "PARTLY", reason: "E901 mentions an alignment check but does not link it to the wear.",
    },
  ],
};

const COMPRESSOR: Fixture = {
  answer:
    "Instrument Air Compressor C-310 had high bearing vibration in December 2024, and the drive end bearing " +
    "was replaced [E903]. Its planned 4000 hour service followed in April 2025 [E904]. " +
    "The bearing failed again in June 2025 [E999].",
  records: [EVENTS.E903, EVENTS.E904],
  tool_calls: [
    {
      name: "search_records",
      arguments: { query: "compressor bearing vibration", equipment: ["Instrument Air Compressor C-310"] },
      output: { records: [EVENTS.E903, EVENTS.E904] },
    },
  ],
  sentences: [
    {
      text: "Instrument Air Compressor C-310 had high bearing vibration in December 2024, and the drive end bearing was replaced [E903].",
      ids: ["E903"], verdict: "SUPPORTED", reason: "Matches the date, failure mode and action in E903.",
    },
    {
      text: "Its planned 4000 hour service followed in April 2025 [E904].",
      ids: ["E904"], verdict: "SUPPORTED", reason: "E904 is the scheduled service dated 2025-04-14.",
    },
    {
      text: "The bearing failed again in June 2025 [E999].",
      ids: ["E999"], verdict: "NOT_SUPPORTED", reason: "E999 does not exist in the log.",
    },
  ],
};

const PM_COMPLIANCE: Fixture = {
  answer:
    "PM compliance was 91.7% in January 2025, with two tasks deferred for spares [P901]. " +
    "It reached 100% in February 2025 [P902].",
  records: [PM.P901, PM.P902],
  tool_calls: [
    { name: "pm_compliance", arguments: { year: 2025 }, output: { rows: [PM.P901, PM.P902] } },
  ],
  sentences: [
    {
      text: "PM compliance was 91.7% in January 2025, with two tasks deferred for spares [P901].",
      ids: ["P901"], verdict: "SUPPORTED", reason: "Matches the rate and comment in P901.",
    },
    {
      text: "It reached 100% in February 2025 [P902].",
      ids: ["P902"], verdict: "SUPPORTED", reason: "P902 shows a rate of 100.",
    },
  ],
};

const ABSTAIN: Fixture = {
  answer: "The log does not record this.",
  records: [],
  tool_calls: [],
  sentences: [
    { text: "The log does not record this.", ids: [], verdict: "NO_CLAIM", reason: "States that the log has no answer." },
  ],
};

// Each starter shows a different path through the interface.
const STARTERS: [string, Fixture][] = [
  ["How many mechanical seal leaks has Cooling Water Pump P-114 had?", PUMP_SEAL],
  ["What work has been done on Instrument Air Compressor C-310?", COMPRESSOR],
  ["What was PM compliance in early 2025?", PM_COMPLIANCE],
  ["Who approved the last flare inspection?", ABSTAIN],
];

const KEYWORDS: [Fixture, string[]][] = [
  [PUMP_SEAL, ["p-114", "p114", "seal", "leak", "pump"]],
  [COMPRESSOR, ["c-310", "c310", "compressor", "bearing", "vibration"]],
  [PM_COMPLIANCE, ["compliance", "pm rate"]],
];

export const starters = () => STARTERS.map(([question]) => question);

function choose(question: string): Fixture {
  const text = question.trim();
  const starter = STARTERS.find(([q]) => q === text);
  if (starter) return starter[1];
  const lowered = text.toLowerCase();
  return KEYWORDS.find(([, words]) => words.some((word) => lowered.includes(word)))?.[0] ?? ABSTAIN;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface MockEvents {
  onStage: (stage: StageName, status: "started" | "done") => void;
  onToolCall: (call: ToolCall) => void;
}

export async function runMock(
  question: string,
  conversationId: string | null,
  events: MockEvents,
): Promise<FinalPayload> {
  const fixture = choose(question);
  const stage = async (name: StageName) => {
    events.onStage(name, "started");
    await wait(DELAY_MS);
    events.onStage(name, "done");
  };

  await stage("rewriting");
  await stage("retrieving");
  events.onStage("answering", "started");
  for (const call of fixture.tool_calls) {
    await wait(DELAY_MS);
    events.onToolCall(call);
  }
  await wait(DELAY_MS);
  events.onStage("answering", "done");
  await stage("checking");

  const answerMs = DELAY_MS * (fixture.tool_calls.length + 1);
  const known = new Set([...Object.keys(EVENTS), ...Object.keys(PM)]);
  const cited = [...new Set(fixture.sentences.flatMap((s) => s.ids))];
  return {
    ...fixture,
    message_id: crypto.randomUUID(),
    conversation_id: conversationId ?? crypto.randomUUID(),
    question,
    cited_ids: cited,
    invalid_ids: cited.filter((id) => !known.has(id)),
    model: {
      profile: "demo",
      requested: { small: "mock", default: "mock" },
      returned: { small: "mock", default: "mock" },
      provider: "mock",
    },
    timings_ms: {
      rewrite: DELAY_MS,
      retrieve: DELAY_MS,
      answer: answerMs,
      check: DELAY_MS,
      total: DELAY_MS * 3 + answerMs,
    },
    mock: true,
  };
}
