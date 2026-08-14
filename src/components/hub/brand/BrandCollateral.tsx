// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircleSlash, Download, Eye, Loader2, Package, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

import { toast } from "sonner";
import {
  COLLATERAL_TIERS,
  clearCollateral,
  downloadCollateralZip,
  generateCollateral,
  getCollateralDetails,
  listCollateral,
} from "@/lib/collateral.functions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CollateralPreviewDialog } from "@/components/hub/brand/CollateralPreviewDialog";
import { CollateralDetailsDialog } from "@/components/hub/brand/CollateralDetailsDialog";
import { CollateralPieceCard } from "@/components/hub/brand/CollateralPieceCard";
import { logoSetFrom } from "@/components/hub/brand/LogoSetPanel";



const KIND_LABELS: Record<string, string> = Object.fromEntries(
  COLLATERAL_TIERS.flatMap((t) => t.kinds.map((k) => [k.kind, k.label])),
);

export function BrandCollateral({ snapshot, kit, locked }: { snapshot: any; kit?: any; locked: boolean }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  /**
   * The kinds a live run is currently working through. Busy state is derived
   * from this *and* the mutation being in flight — a leftover value can never
   * pin a card on "Generating…".
   */
  const [runningKinds, setRunningKinds] = useState<string[]>([]);
  /** Lets the founder escape a run that is taking too long. */
  const stopRef = useRef<AbortController | null>(null);

  const [openKind, setOpenKind] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** Set when a generate attempt was blocked, so we can retry after confirming. */
  const [pendingKinds, setPendingKinds] = useState<string[] | undefined>(undefined);
  /** Per-piece outcome of the last run, so a partial run reads as partial. */
  const [runReport, setRunReport] = useState<Array<{ kind: string; status: "published" | "blocked" | "failed"; detail?: string }> | null>(null);

  const detailsQ = useQuery({
    queryKey: ["collateralDetails", snapshot.id],
    queryFn: () => getCollateralDetails(snapshot.id),
    enabled: !!snapshot?.id && !!locked,
    retry: false,
  });
  const verifiedAt = detailsQ.data?.verifiedAt ?? null;
  const detailsAudit = detailsQ.data?.audit ?? null;


  const q = useQuery({
    queryKey: ["brandCollateral", snapshot.id],
    queryFn: () => listCollateral(snapshot.id),
    enabled: !!snapshot?.id,
  });
  const items = q.data ?? [];

  const byKind = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const item of items) (m[item.kind] ??= []).push(item);
    return m;
  }, [items]);

  /** Founder's chosen mark per piece; absent means the layout decides. */
  const [markChoice, setMarkChoice] = useState<Record<string, { form: string; tone: string }>>({});
  /** What the last run actually drew, per piece. */
  const [marksUsed, setMarksUsed] = useState<Record<string, any>>({});

  // Hydrate from the kit once it lands, without clobbering a choice made in
  // this session.
  const storedChoice = kit?.collateral_mark_choice ?? null;
  useEffect(() => {
    if (!storedChoice) return;
    const picks: Record<string, any> = {};
    const used: Record<string, any> = {};
    for (const [kind, v] of Object.entries(storedChoice as Record<string, any>)) {
      if (v?.requested?.form && v?.requested?.tone) picks[kind] = v.requested;
      if (v?.used?.form) used[kind] = v.used;
    }
    setMarkChoice((prev) => ({ ...picks, ...prev }));
    setMarksUsed((prev) => ({ ...used, ...prev }));
  }, [storedChoice]);


  /** Slots the venture has actually uploaded, so absent cells read as absent. */
  const availableSlots = useMemo(() => {
    const set = logoSetFrom(kit?.logos);
    return Object.fromEntries(Object.keys(set).map((k) => [k, true]));
  }, [kit?.logos]);


  /** Pieces deleted mid-run — the loop skips them instead of re-rendering them. */
  const droppedRef = useRef<Set<string>>(new Set());

  const gen = useMutation({
    // Rasterising several pieces in one call blows the edge worker's CPU and
    // memory budget, so we walk through them one at a time.
    mutationFn: async (kinds?: string[]) => {
      const all = kinds?.length ? kinds : COLLATERAL_TIERS.flatMap((t) => t.kinds.map((k) => k.kind));
      const controller = new AbortController();
      stopRef.current = controller;
      droppedRef.current = new Set();
      const generated: any[] = [];
      const failed: any[] = [];
      const qcIssues: any[] = [];
      const attempted: string[] = [];
      let artDirection: any = null;
      const marks: Record<string, any> = {};
      // One piece per call. Multi-page pieces (deck, guidelines) rasterise five
      // pages, and pairing them exhausts the edge worker's CPU budget.
      for (let i = 0; i < all.length; i += 1) {
        const kind = all[i];
        if (controller.signal.aborted) break;
        if (droppedRef.current.has(kind)) continue;
        attempted.push(kind);
        const res: any = await generateCollateral(snapshot.id, [kind], markChoice, { signal: controller.signal });
        generated.push(...(res?.generated ?? []));
        failed.push(...(res?.failed ?? []));
        qcIssues.push(...(res?.qcIssues ?? []));
        artDirection ??= res?.artDirection ?? null;
        Object.assign(marks, res?.marks ?? {});
        // This piece is finished — release its card immediately.
        setRunningKinds((prev) => prev.filter((k) => k !== kind));
        qc.invalidateQueries({ queryKey: ["brandCollateral", snapshot.id] });
      }
      setMarksUsed((prev) => ({ ...prev, ...marks }));
      return { ok: true, generated, failed, qcIssues, artDirection, marks, attempted };
    },

    onMutate: (kinds) => {
      setRunReport(null);
      setRunningKinds(kinds?.length ? [...kinds] : COLLATERAL_TIERS.flatMap((t) => t.kinds.map((k) => k.kind)));
    },
    onSettled: () => {
      stopRef.current = null;
      droppedRef.current = new Set();
      setRunningKinds([]);
    },

    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["brandCollateral", snapshot.id] });
      const failed = res?.failed ?? [];
      const arch = res?.artDirection?.archetype;
      const issues = res?.qcIssues ?? [];

      // A run is a list of outcomes, not a single pass/fail. Report every piece
      // so a blocked page reads as one blocked page, not "generation broke".
      const attempted: string[] = res?.attempted ?? [];
      setRunReport(attempted.map((kind) => {
        const hardFail = failed.find((f: any) => f.kind === kind);
        if (hardFail) return { kind, status: "failed" as const, detail: String(hardFail.error ?? "").replace(/^QUALITY_GATE_FAILED\s*—\s*/, "") };
        const pageIssues = issues.filter((i: any) => i.kind === kind);
        if (pageIssues.length) {
          return {
            kind,
            status: "blocked" as const,
            detail: `${pageIssues.length} page${pageIssues.length === 1 ? "" : "s"} held back — ${pageIssues[0].reasons?.[0] ?? "failed the print check"}`,
          };
        }
        return { kind, status: "published" as const };
      }));

      if (failed.length) toast.warning(`Generated with ${failed.length} skipped: ${failed.map((f: any) => f.kind).join(", ")}`);
      else if (issues.length) {
        toast.warning(`${issues.length} page${issues.length === 1 ? "" : "s"} failed the print check`, {
          description: issues.slice(0, 3).map((i: any) => `${i.page}: ${i.reasons[0]}`).join("  ·  "),
        });
      } else toast.success(arch ? `Collateral generated — art direction: ${String(arch).replace(/_/g, " ")}.` : "Collateral generated.");
    },
    onError: (e: any) => {
      // Stopping is a choice, not a failure.
      if (e?.code === "ABORTED") {
        toast.info("Generation stopped. You can generate any piece again.");
        return;
      }
      // Missing text is a fixable gap, not a failure — send them to the form.
      if (e?.code === "DETAILS_INCOMPLETE") {
        toast.warning(e.message);
        setDetailsOpen(true);
        return;
      }
      toast.error(e.message || "Generation failed");
    },
  });

  /** A card is busy only while a run is genuinely in flight and holds that kind. */
  const running = useMemo(
    () => new Set(gen.isPending ? runningKinds : []),
    [gen.isPending, runningKinds],
  );

  const stopRun = () => {
    stopRef.current?.abort();
    setRunningKinds([]);
  };

  /** Generate, but confirm the text inventory first if it has never been signed off. */
  const requestGen = (kinds?: string[]) => {
    setPendingKinds(kinds);
    if (!verifiedAt) {
      setDetailsOpen(true);
      return;
    }
    gen.mutate(kinds);
  };


  const wipe = useMutation({
    mutationFn: (kind?: string) => clearCollateral(snapshot.id, kind),
    // Deleting a piece also retires everything the UI still remembers about it,
    // so a cleared card reads as "Not generated" and stays generatable — even
    // if a run was in flight when the founder deleted it.
    onSuccess: (_res, kind) => {
      const cleared = kind ? [kind] : COLLATERAL_TIERS.flatMap((t) => t.kinds.map((k) => k.kind));
      for (const k of cleared) droppedRef.current.add(k);
      setRunningKinds((prev) => prev.filter((k) => !cleared.includes(k)));
      setRunReport((prev) => {
        const next = (prev ?? []).filter((r) => !cleared.includes(r.kind));
        return next.length ? next : null;
      });
      setMarksUsed((prev) => {
        const next = { ...prev };
        for (const k of cleared) delete next[k];
        return next;
      });
      if (!kind) stopRun();
      qc.invalidateQueries({ queryKey: ["brandCollateral", snapshot.id] });
      toast.success("Cleared.");
    },
    onError: (e: any) => toast.error(e.message || "Clear failed"),
  });

  const onClearAll = async () => {
    if (await confirm({ title: "Clear all collateral?", description: "Every generated card, letterhead and template is removed. Your brand kit is untouched.", destructive: true, confirmText: "Clear" })) {
      wipe.mutate(undefined);
    }
  };


  const openMeta = useMemo(
    () => COLLATERAL_TIERS.flatMap((t) => t.kinds).find((k) => k.kind === openKind) ?? null,
    [openKind],
  );

  // Prefer the staged mock-up for the library thumbnail — a flat card on white
  // reads like a wireframe at 64px.
  const previewOf = (kind: string) => {
    const files = byKind[kind] ?? [];
    const mock = files.find((i) => i.mime_type === "image/png" && /-mockup$/.test(i.name ?? ""));
    return (mock ?? files.find((i) => i.mime_type === "image/png"))?.url ?? null;
  };

  const isStale = (kind: string) => (byKind[kind] ?? []).some((i) => i?.meta?.stale);

  /** Print-check state for a piece: every page measured against its standard. */
  const qcState = (kind: string) => {
    const verdicts = (byKind[kind] ?? []).map((i) => i?.meta?.qc).filter(Boolean) as any[];
    if (!verdicts.length) return null;
    const reasons = [...new Set(verdicts.flatMap((v) => (v.ok ? [] : v.reasons ?? [])))];
    return { ok: reasons.length === 0, reasons };
  };


  const totalKinds = COLLATERAL_TIERS.reduce((n, t) => n + t.kinds.length, 0);
  const generatedKinds = COLLATERAL_TIERS.flatMap((t) => t.kinds).filter((k) => (byKind[k.kind] ?? []).length > 0).length;

  return (
    <div className="space-y-5">
      {/* Value banner — one clear statement of what the founder gets */}
      <div className="rounded-xl border border-border bg-background/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Brand collateral
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {!locked
                ? `Lock your brand kit and we typeset ${totalKinds} print-ready pieces — business card, letterhead, envelope, invoice, guidelines and more — straight from your palette, type and vector mark.`
                : items.length === 0
                  ? `${totalKinds} print-ready pieces, typeset from your locked palette, typography and vector mark. No AI guesswork on the type — hand these straight to a printer.`
                  : `${items.length} files ready across ${generatedKinds} of ${totalKinds} pieces — print-checked and ready for a printer or your inbox.`}
            </p>
            {locked && (
              <button
                type="button"
                onClick={() => { setPendingKinds(undefined); setDetailsOpen(true); }}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] hover:underline"
              >
                <ShieldCheck className={`h-3.5 w-3.5 ${verifiedAt ? "text-status-success" : "text-status-warning"}`} />
                <span className={verifiedAt ? "text-muted-foreground" : "text-status-warning"}>
                  {verifiedAt
                    ? "Contact details verified — edit"
                    : `Confirm your contact details first${detailsAudit?.missingRequired?.length ? ` · ${detailsAudit.missingRequired.length} blank` : ""}`}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {items.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={onClearAll} disabled={wipe.isPending} className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="mr-1 h-3 w-3" />Delete all
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadCollateralZip(items, snapshot?.company_name)}>
                  <Download className="mr-1 h-3 w-3" />Download ZIP
                </Button>
              </>
            )}
            {gen.isPending && (
              <Button size="sm" variant="outline" onClick={stopRun}>
                <CircleSlash className="mr-1 h-3 w-3" />Stop
              </Button>
            )}
            <Button size="sm" onClick={() => requestGen(undefined)} disabled={!locked || gen.isPending}>
              {gen.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              {items.length > 0 ? "Regenerate all" : "Generate all"}
            </Button>

          </div>
        </div>

        {!locked && (
          <p className="mt-3 rounded-lg border border-status-warning/30 bg-status-warning/5 p-3 text-xs text-status-warning">
            Lock your brand kit (palette, typography and a saved vector logo) first — collateral is typeset around the mark.
          </p>
        )}
      </div>

      {runReport && runReport.some((r) => r.status !== "published") && (
        <div className="rounded-xl border border-status-warning/30 bg-status-warning/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-status-warning">Last run</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {runReport.filter((r) => r.status === "published").length} of {runReport.length} pieces published. The rest are listed below with the reason — everything that passed is already in your library.
          </p>
          <ul className="mt-3 space-y-2">
            {runReport.filter((r) => r.status !== "published").map((r) => (
              <li key={r.kind} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-background/60 p-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{KIND_LABELS[r.kind] ?? r.kind}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{r.detail}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => requestGen([r.kind])} disabled={gen.isPending}>
                  Retry
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {COLLATERAL_TIERS.map((tier) => {
        const doneInTier = tier.kinds.filter((k) => (byKind[k.kind] ?? []).length > 0).length;
        return (
          <div key={tier.tier} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">{tier.label}</div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{tier.blurb}</p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {doneInTier} of {tier.kinds.length} generated
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tier.kinds.map((k) => (
                <CollateralPieceCard
                  key={k.kind}
                  label={k.label}
                  note={k.note}
                  preview={previewOf(k.kind)}
                  fileCount={(byKind[k.kind] ?? []).length}
                  stale={isStale(k.kind)}
                  qc={qcState(k.kind)}
                  busy={running.has(k.kind)}
                  markChoice={markChoice[k.kind] ?? null}
                  markUsed={marksUsed[k.kind] ?? null}
                  availableSlots={availableSlots}
                  onMarkChoice={(choice) =>
                    setMarkChoice((prev) => {
                      const next = { ...prev };
                      if (choice) next[k.kind] = choice;
                      else delete next[k.kind];
                      return next;
                    })}

                  canGenerate={!!locked}
                  disabled={!locked || gen.isPending}
                  onPreview={() => setOpenKind(k.kind)}
                  onGenerate={() => requestGen([k.kind])}
                  onDelete={async () => {
                    if (await confirm({ title: `Delete ${k.label}?`, description: "The generated files for this piece are removed. You can regenerate at any time.", destructive: true, confirmText: "Delete" })) {
                      wipe.mutate(k.kind);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}


      <CollateralPreviewDialog
        open={!!openKind}
        onOpenChange={(v) => setOpenKind(v ? openKind : null)}
        kind={openMeta}
        files={openKind ? (byKind[openKind] ?? []) : []}
        busy={gen.isPending && (busyKind === openKind || busyKind === "all")}
        canGenerate={!!locked}
        onRegenerate={() => openKind && requestGen([openKind])}
        onClear={async () => {
          if (!openKind) return;
          if (await confirm({ title: `Clear ${openMeta?.label ?? "this piece"}?`, description: "The generated files for this piece are removed. You can regenerate at any time.", destructive: true, confirmText: "Clear" })) {
            wipe.mutate(openKind);
          }
        }}
      />

      <CollateralDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        snapshotId={snapshot.id}
        onVerified={() => {
          detailsQ.refetch();
          gen.mutate(pendingKinds);
        }}
      />

    </div>
  );
}

