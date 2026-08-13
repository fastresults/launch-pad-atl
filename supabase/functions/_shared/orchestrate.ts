// Continuous orchestration: the hand-off between generation stages.
//
// A founder should never have to press a second button. Bulk asset generation
// finishing is not the end of the flow — it is the trigger for the website
// brief, and a blocker being cleared is the trigger for whatever was waiting on
// it. This module owns those hand-offs so both the bulk runner and the watchdog
// drive the same ladder:
//
//   assets → (brand locked) → website brief → collateral/imagery sweeps
//
// Every step is idempotent, bounded by an attempt budget recorded on the row,
// and safe to call repeatedly from a cron.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Never let a self-driving stage retry forever. */
export const MAX_ORCHESTRATION_ATTEMPTS = 3;

export type OrchestrationResult = {
  snapshotId: string;
  unblocked: string[];
  started: string[];
  waiting: string | null;
};

function internalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-key": SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
}

async function invoke(fn: string, body: unknown): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify(body),
  });
}

async function brandIsLocked(supabase: any, snapshotId: string): Promise<boolean> {
  const { data } = await supabase
    .from("venture_brand_kits")
    .select("status")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  return data?.status === "locked";
}

/**
 * A blocker that no longer applies is not a blocker.
 *
 * Assets parked with a `blocked_reason` used to stay parked for good: the
 * reason was written at the moment of the block and nothing ever re-evaluated
 * it. Once the brand is locked, every brand-gated asset is released back to the
 * retry engine automatically.
 */
export async function clearResolvedBlockers(
  supabase: any,
  snapshotId: string,
  locked: boolean,
): Promise<string[]> {
  if (!locked) return [];
  const { data } = await supabase
    .from("venture_documents")
    .select("id, document_type, blocked_reason")
    .eq("snapshot_id", snapshotId)
    .not("blocked_reason", "is", null);
  const rows = (data ?? []).filter((r: any) => /brand/i.test(String(r.blocked_reason ?? "")));
  if (!rows.length) return [];
  await supabase
    .from("venture_documents")
    .update({ blocked_reason: null, last_error: null, status: "pending" })
    .in("id", rows.map((r: any) => r.id));
  return rows.map((r: any) => r.document_type);
}

/** Infrastructure hiccups (upstream 5xx, timeouts, rate limits) are not the
 * venture's fault, so they get their own larger allowance and a cooldown
 * instead of permanently burning the stage's budget. */
const MAX_INFRA_ATTEMPTS = 12;
const INFRA_COOLDOWN_MS = 15 * 60_000;

function isInfraFailure(err: string | null | undefined): boolean {
  const m = String(err ?? "");
  return /\b(5\d\d|429|timeout|timed out|aborted|unavailable|upstream|overloaded|resource limit)\b/i.test(m);
}

/** Has this stage already burned its budget for this venture? */
async function budgetSpent(supabase: any, snapshotId: string, documentType: string): Promise<string | null> {
  const { data } = await supabase
    .from("venture_documents")
    .select("metadata, status, last_error")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType)
    .maybeSingle();
  const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
  const attempts = Number(metadata.orchestration_attempts ?? 0);
  const infra = isInfraFailure(data?.last_error);

  if (infra) {
    if (attempts >= MAX_INFRA_ATTEMPTS) return `${documentType}_infra_budget_exhausted`;
    const last = Date.parse(String(metadata.orchestrated_at ?? "")) || 0;
    if (last && Date.now() - last < INFRA_COOLDOWN_MS) return `${documentType}_cooldown`;
    return null;
  }

  return attempts >= MAX_ORCHESTRATION_ATTEMPTS ? `${documentType}_budget_exhausted` : null;
}

async function noteAttempt(supabase: any, snapshotId: string, documentType: string): Promise<void> {
  const { data } = await supabase
    .from("venture_documents")
    .select("id, metadata, last_error")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", documentType)
    .maybeSingle();
  const metadata = { ...((data?.metadata ?? {}) as Record<string, unknown>) };
  // Only a real, non-infrastructural failure counts against the hard budget.
  if (!isInfraFailure(data?.last_error)) {
    metadata.orchestration_attempts = Number(metadata.orchestration_attempts ?? 0) + 1;
  }
  metadata.orchestrated_at = new Date().toISOString();
  if (data?.id) {
    await supabase.from("venture_documents").update({ metadata }).eq("id", data.id);
  } else {
    await supabase.from("venture_documents").upsert({
      snapshot_id: snapshotId,
      document_type: documentType,
      status: "pending",
      metadata,
    }, { onConflict: "snapshot_id,document_type" });
  }
}

/**
 * Drive the venture one step further down the ladder.
 *
 * Called when a bulk run settles, and again by the watchdog for any venture
 * that looks finished-but-not-really. Returns what it released and what it
 * started so the caller can log a single honest line.
 */
export async function orchestrateNextStage(
  supabase: any,
  snapshotId: string,
): Promise<OrchestrationResult> {
  const result: OrchestrationResult = { snapshotId, unblocked: [], started: [], waiting: null };

  const locked = await brandIsLocked(supabase, snapshotId);
  result.unblocked = await clearResolvedBlockers(supabase, snapshotId, locked);

  if (!locked) {
    result.waiting = "brand_lock";
    return result;
  }

  // Stage: the website brief. Excluded from bulk runs by design (it is the
  // slowest, most brand-dependent asset), which is exactly why nothing used to
  // start it. The moment the brand is locked and the assets have settled, it
  // starts itself.
  const { data: prd } = await supabase
    .from("venture_documents")
    .select("status, content")
    .eq("snapshot_id", snapshotId)
    .eq("document_type", "website_prd")
    .maybeSingle();

  const prdSettled = prd?.status === "complete" || prd?.status === "generating";
  if (!prdSettled) {
    const held = await budgetSpent(supabase, snapshotId, "website_prd");
    if (held) {
      result.waiting = held;
      return result;
    }
    await noteAttempt(supabase, snapshotId, "website_prd");
    try {
      await invoke("venture-generate-document", { snapshotId, documentType: "website_prd" });
      result.started.push("website_prd");
    } catch (e) {
      console.error("orchestrate: website_prd start failed", e);
    }
    return result;
  }

  if (prd?.status === "generating") {
    result.waiting = "website_prd";
    return result;
  }

  // Stage: header art for everything that finished while the run was moving.
  try {
    await invoke("venture-hero-sweep", { snapshotId });
    result.started.push("hero_sweep");
  } catch (e) {
    console.error("orchestrate: hero sweep failed", e);
  }

  return result;
}

/**
 * Truthful progress: settled work over total active work, always derived from
 * the documents themselves rather than a counter inside one run. A resumed run
 * that only retries three assets must not report a collapse from 90% to 10%.
 */
export async function derivedProgressPct(
  supabase: any,
  snapshotId: string,
  types: string[],
): Promise<number> {
  if (!types.length) return 0;
  const { data } = await supabase
    .from("venture_documents")
    .select("document_type, status")
    .eq("snapshot_id", snapshotId)
    .in("document_type", types);
  const settled = (data ?? []).filter((d: any) =>
    d.status === "complete" || d.status === "not_applicable"
  ).length;
  return Math.max(0, Math.min(100, Math.round((settled / types.length) * 100)));
}
