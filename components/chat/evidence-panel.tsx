"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinalPayload, LogRecord, Sentence, ToolCall } from "@/lib/types";

const FIELD_LABELS: Record<string, string> = {
  id: "Record",
  date: "Date",
  equipment: "Equipment",
  type: "Type",
  failure_mode: "Failure mode",
  root_cause: "Root cause",
  downtime_h: "Downtime (h)",
  action: "Action",
  recurred: "Recurred",
  remarks: "Remarks",
  year: "Year",
  month: "Month",
  scheduled: "Scheduled",
  done: "Completed",
  rate: "Rate (%)",
  comment: "Comment",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function RecordDetails({ record, active }: { record: LogRecord; active: boolean }) {
  return (
    <dl
      data-citation={record.id}
      className={cn(
        "grid scroll-mt-4 grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 rounded-lg border p-3 text-sm",
        active && "border-brand/50",
      )}
    >
      {Object.entries(record).map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{FIELD_LABELS[key] ?? key}</dt>
          <dd className={cn("min-w-0 break-words", key === "id" && "font-mono")}>
            {value === null || value === "" ? "Not recorded" : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function VerdictBadge({ verdict }: { verdict: Sentence["verdict"] }) {
  if (verdict === "NO_CLAIM") return null;
  if (verdict === "SUPPORTED") {
    return (
      <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400">
        Supported
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-destructive/50 text-destructive">
      {verdict === "PARTLY" ? "Not supported (partly)" : "Not supported"}
    </Badge>
  );
}

function ToolCallItem({ call }: { call: ToolCall }) {
  return (
    <details className="rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer font-mono text-[13px]">{call.name}</summary>
      <p className="mt-2.5 text-xs text-muted-foreground">Input</p>
      <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
        {JSON.stringify(call.arguments, null, 2)}
      </pre>
      <p className="mt-2.5 text-xs text-muted-foreground">Output</p>
      <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-muted p-2 font-mono text-xs">
        {JSON.stringify(call.output, null, 2)}
      </pre>
    </details>
  );
}

export function EvidenceContent({
  payload,
  activeCitation,
}: {
  payload: FinalPayload;
  activeCitation: string | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeCitation) return;
    container.current
      ?.querySelector(`[data-citation="${activeCitation}"]`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [activeCitation, payload.message_id]);

  return (
    <div ref={container} className="flex flex-col gap-6 p-4">
      <Section title="Cited records">
        {payload.invalid_ids.map((id) => (
          <p
            key={id}
            data-citation={id}
            className={cn(
              "scroll-mt-4 rounded-lg border border-dashed border-destructive/60 p-3 text-sm",
              activeCitation === id && "bg-destructive/10",
            )}
          >
            <span className="font-mono">{id}</span> was cited, but it does not exist in the log.
          </p>
        ))}
        {payload.records.map((record) => (
          <RecordDetails
            key={record.id}
            record={record}
            active={activeCitation === record.id}
          />
        ))}
        {payload.records.length === 0 && payload.invalid_ids.length === 0 && (
          <p className="text-sm text-muted-foreground">This answer cites no records.</p>
        )}
      </Section>

      <Section title="Tools used">
        {payload.tool_calls.map((call, index) => (
          <ToolCallItem key={index} call={call} />
        ))}
        {payload.tool_calls.length === 0 && (
          <p className="text-sm text-muted-foreground">No tools were called for this answer.</p>
        )}
      </Section>

      <Section title="Claim check">
        <ul className="flex flex-col gap-3">
          {payload.sentences.map((sentence, index) => (
            <li key={index} className="flex flex-col items-start gap-1.5 border-b pb-3 text-sm last:border-0 last:pb-0">
              <VerdictBadge verdict={sentence.verdict} />
              <p>{sentence.text}</p>
              <p className="text-xs text-muted-foreground">{sentence.reason}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Run details">
        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-muted-foreground">Profile</dt>
          <dd>{payload.model.profile}</dd>
          <dt className="text-muted-foreground">Small model</dt>
          <dd className="min-w-0 font-mono break-words">{payload.model.requested.small}</dd>
          <dt className="text-muted-foreground">Default model</dt>
          <dd className="min-w-0 font-mono break-words">{payload.model.requested.default}</dd>
          <dt className="text-muted-foreground">Returned</dt>
          <dd className="min-w-0 font-mono break-words">
            {payload.model.returned.small}, {payload.model.returned.default}
          </dd>
          <dt className="text-muted-foreground">Provider</dt>
          <dd>{payload.model.provider}</dd>
          <dt className="text-muted-foreground">Total time</dt>
          <dd>{(payload.timings_ms.total / 1000).toFixed(1)} s</dd>
        </dl>
      </Section>
    </div>
  );
}

export function EvidenceHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <h2 className="text-sm font-medium">Evidence</h2>
      <Button size="icon" variant="ghost" aria-label="Close evidence" onClick={onClose} className="size-7">
        <X className="size-4" />
      </Button>
    </div>
  );
}
