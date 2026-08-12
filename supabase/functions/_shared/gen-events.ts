// Forensic telemetry for asset generation.
//
// Every attempt — start, checkpoint, success, block, failure — writes one row
// to venture_generation_events. Edge function logs roll off; this table is what
// lets us answer "which asset type fails, on which model, after how long, and
// with which error class" weeks later.

export type GenOutcome =
  | "started"
  | "checkpoint"
  | "complete"
  | "blocked"
  | "failed"
  | "skipped";

export type GenEvent = {
  snapshotId: string;
  documentType: string;
  jobId?: string | null;
  phase?: string | null;
  mode?: string | null;
  model?: string | null;
  attempt?: number | null;
  durationMs?: number | null;
  outcome: GenOutcome;
  error?: string | null;
};

/** Bucket free-text errors so failures can be grouped and trended. */
export function classifyError(message: string): string {
  const m = (message ?? "").toLowerCase();
  if (/timeout|timed out|abort/.test(m)) return "timeout";
  if (/429|rate limit/.test(m)) return "rate_limited";
  if (/402|payment|credit/.test(m)) return "credits";
  if (/truncat|cut off|length/.test(m)) return "truncated";
  if (/context length|too many tokens|maximum context/.test(m)) return "context_overflow";
  if (/gateway 5\d\d|502|503|504|upstream/.test(m)) return "upstream_5xx";
  if (/gateway 4\d\d|400|401|403/.test(m)) return "upstream_4xx";
  if (/brand|intake|blocked/.test(m)) return "gated";
  if (/network|fetch failed|connection/.test(m)) return "network";
  return "unknown";
}

/** Never throws — telemetry must not be able to fail a generation run. */
export async function logGenEvent(supabase: any, ev: GenEvent): Promise<void> {
  try {
    await supabase.from("venture_generation_events").insert({
      snapshot_id: ev.snapshotId,
      document_type: ev.documentType,
      job_id: ev.jobId ?? null,
      phase: ev.phase ?? null,
      mode: ev.mode ?? null,
      model: ev.model ?? null,
      attempt: ev.attempt ?? 1,
      duration_ms: ev.durationMs ?? null,
      outcome: ev.outcome,
      error_class: ev.error ? classifyError(ev.error) : null,
      error: ev.error ? String(ev.error).slice(0, 600) : null,
    });
  } catch (e) {
    console.warn("gen-event log failed", e);
  }
}
