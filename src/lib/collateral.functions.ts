// @ts-nocheck
import { invokeEdge } from "@/lib/edge-invoke";

export type CollateralItem = {
  id: string;
  snapshot_id: string;
  kind: string;
  name: string;
  storage_path: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
  meta: Record<string, unknown>;
  url: string | null;
  created_at: string;
};

/** Display order + copy for the deliverable set. */
export const COLLATERAL_TIERS: Array<{
  tier: "minimum" | "standard" | "premium";
  label: string;
  blurb: string;
  kinds: Array<{ kind: string; label: string; note: string }>;
}> = [
  {
    tier: "minimum",
    label: "Essentials",
    blurb: "The pieces every identity ships with — print-ready and typeset from your locked kit.",
    kinds: [
      { kind: "business_card", label: "Business card", note: "Front + back, 3.5×2in at 300dpi" },
      { kind: "letterhead", label: "Letterhead", note: "US Letter, print + digital" },
      { kind: "envelope", label: "#10 envelope", note: "Return address + stamp zone" },
      { kind: "notecard", label: "Notecard", note: "A2 thank-you card" },
      { kind: "email_signature", label: "Email signature", note: "PNG + paste-ready HTML" },
    ],
  },
  {
    tier: "standard",
    label: "Standard add-ons",
    blurb: "Everything you need to send a document out under your own name.",
    kinds: [
      { kind: "invoice", label: "Invoice template", note: "Line items, totals, terms" },
      { kind: "proposal", label: "Proposal template", note: "Scope, timeline, investment" },
      { kind: "presentation", label: "Presentation master", note: "Cover, section, content, closing" },
      { kind: "guidelines", label: "Brand guidelines", note: "Logo, colour, type, voice pages" },
    ],
  },
  {
    tier: "premium",
    label: "Web & handoff",
    blurb: "Hand these to a developer and the site comes out on brand.",
    kinds: [
      { kind: "design_tokens", label: "Design tokens", note: "CSS variables + JSON with full colour spaces" },
      {
        kind: "style_system",
        label: "Style system",
        note: "Portable spec + drop-in CSS — paste into another project and it comes out on brand",
      },
    ],
  },
];

async function call(body: any) {
  const { data, error } = await invokeEdge("venture-collateral", { body });
  if (error) throw new Error(error.message || "Collateral request failed");
  if (data?.error) {
    const err: any = new Error(data.error);
    err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * The generation itself is model-bound and can legitimately run for minutes, so
 * we never abort the request — we only give the *UI* a way out. The promise
 * below settles on stop or on a generous deadline; the in-flight work is left
 * to finish server-side rather than being cancelled mid-render.
 */
export type RunEscape = { signal?: AbortSignal; timeoutMs?: number };

const DEFAULT_ESCAPE_MS = 10 * 60_000;

function withEscape<T>(work: Promise<T>, opts?: RunEscape): Promise<T> {
  const signal = opts?.signal;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_ESCAPE_MS;
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const finish = (fn: (v: any) => void, value: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    };
    function onAbort() {
      finish(reject, Object.assign(new Error("Stopped"), { code: "ABORTED" }));
    }
    const timer = setTimeout(
      () => finish(reject, Object.assign(new Error("Timed out — retry this piece"), { code: "TIMEOUT" })),
      timeoutMs,
    );
    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });
    work.then((v) => finish(resolve, v), (e) => finish(reject, e));
  });
}


export async function listCollateral(snapshotId: string): Promise<CollateralItem[]> {
  const data = await call({ action: "list", snapshotId });
  return (data?.items ?? []) as CollateralItem[];
}

export type LogoForm = "symbol" | "horizontal" | "stacked" | "wordmark";
export type LogoTone = "colour" | "inverse";
export type MarkCell = { form: LogoForm; tone: LogoTone };
/** A piece's mark decisions, keyed by mark slot id (`front`, `cover`, …). */
export type MarkChoice = Record<string, MarkCell>;

export async function generateCollateral(
  snapshotId: string,
  kinds?: string[],
  markChoice?: Record<string, MarkChoice>,
  escape?: RunEscape,
) {
  const requested = kinds?.length
    ? kinds
    : COLLATERAL_TIERS.flatMap((tier) => tier.kinds.map((item) => item.kind));

  // Wrap each piece's picks in the canonical `{ slots }` envelope the renderer
  // stores and reads. Sending the bare slot map worked only by accident.
  const picks = markChoice
    ? Object.fromEntries(Object.entries(markChoice).map(([kind, slots]) => [kind, { slots }]))
    : undefined;

  // Edge rendering is CPU-bound (wasm + pixel QC). Keep each invocation
  // independently retryable so one complex deck cannot take the entire brand
  // package down with WORKER_RESOURCE_LIMIT. Multi-page kinds come back with
  // `more: true` and the page to resume from — a bounded slice per worker.
  const generated: any[] = [];
  const failed: any[] = [];
  const qcIssues: any[] = [];
  let artDirection: any = null;
  const marks: Record<string, any> = {};
  for (const kind of requested) {
    let fromPage = 0;
    for (let slice = 0; slice < 12; slice++) {
      try {
        const result = await withEscape(
          call({ action: "generate", snapshotId, kinds: [kind], fromPage, markChoice: picks }),
          escape,
        );
        generated.push(...(result?.generated ?? []));
        failed.push(...(result?.failed ?? []));
        qcIssues.push(...(result?.qcIssues ?? []));
        artDirection ??= result?.artDirection ?? null;
        if (result?.marks?.length) marks[kind] = result.marks;
        if (!result?.more || typeof result?.nextPage !== "number" || result.nextPage <= fromPage) break;
        fromPage = result.nextPage;
      } catch (e: any) {
        // A stop request ends the whole run; anything else is one piece's
        // problem, so the rest of the library still publishes.
        if (e?.code === "ABORTED") throw e;
        if (e?.code === "DETAILS_INCOMPLETE") throw e;
        failed.push({ kind, error: e?.message ?? "Generation failed" });
        break;
      }
    }
  }
  return { ok: failed.length === 0, generated, failed, qcIssues, artDirection, marks };

}



export async function clearCollateral(snapshotId: string, kind?: string) {
  return call({ action: "delete", snapshotId, kind });
}

/** Bundle every generated file into a single ZIP the founder can hand to a printer. */
export async function downloadCollateralZip(items: CollateralItem[], company: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const item of items) {
    if (!item.url) continue;
    try {
      const res = await fetch(item.url);
      if (!res.ok) continue;
      const ext = item.storage_path?.split(".").pop() ?? "png";
      zip.folder(item.kind)!.file(`${item.name}.${ext}`, await res.blob());
    } catch { /* skip unreachable file */ }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(company || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brand-kit.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── text inventory ──────────────────────────────────────────────────────────

export type CollateralSuggestion = { value: string; basis: string };

export type CollateralDetailsPayload = {
  details: Record<string, string>;
  /** Fields the AI filled in from the founder's own material. */
  suggested: Record<string, CollateralSuggestion>;
  verifiedAt: string | null;
  audit: any;
};

/** Pre-filled text inventory plus the audit grading each field. */
export async function getCollateralDetails(snapshotId: string): Promise<CollateralDetailsPayload> {
  const data = await call({ action: "details:get", snapshotId });
  return {
    details: data?.details ?? {},
    suggested: data?.suggested ?? {},
    verifiedAt: data?.verifiedAt ?? null,
    audit: data?.audit ?? null,
  };
}

/** Re-read the brief and finished assets to refresh the suggested values. */
export async function rescanCollateralDetails(snapshotId: string): Promise<CollateralDetailsPayload> {
  const data = await call({ action: "details:rescan", snapshotId });
  return {
    details: data?.details ?? {},
    suggested: data?.suggested ?? {},
    verifiedAt: data?.verifiedAt ?? null,
    audit: data?.audit ?? null,
  };
}

export async function saveCollateralDetails(snapshotId: string, details: Record<string, string>) {
  return call({ action: "details:save", snapshotId, details });
}
