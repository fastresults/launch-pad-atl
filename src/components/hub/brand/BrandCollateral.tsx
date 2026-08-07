// @ts-nocheck
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Loader2, Package, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
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


export function BrandCollateral({ snapshot, locked }: { snapshot: any; locked: boolean }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** Set when a generate attempt was blocked, so we can retry after confirming. */
  const [pendingKinds, setPendingKinds] = useState<string[] | undefined>(undefined);

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

  const gen = useMutation({
    // Rasterising several pieces in one call blows the edge worker's CPU and
    // memory budget, so we walk through them one at a time.
    mutationFn: async (kinds?: string[]) => {
      const all = kinds?.length ? kinds : COLLATERAL_TIERS.flatMap((t) => t.kinds.map((k) => k.kind));
      const generated: any[] = [];
      const failed: any[] = [];
      const qcIssues: any[] = [];
      let artDirection: any = null;
      // One piece per call. Multi-page pieces (deck, guidelines) rasterise five
      // pages, and pairing them exhausts the edge worker's CPU budget.
      for (let i = 0; i < all.length; i += 1) {
        const res: any = await generateCollateral(snapshot.id, all.slice(i, i + 1));
        generated.push(...(res?.generated ?? []));
        failed.push(...(res?.failed ?? []));
        qcIssues.push(...(res?.qcIssues ?? []));
        artDirection ??= res?.artDirection ?? null;
        qc.invalidateQueries({ queryKey: ["brandCollateral", snapshot.id] });
      }
      return { ok: true, generated, failed, qcIssues, artDirection };
    },
    onMutate: (kinds) => setBusyKind(kinds?.length === 1 ? kinds[0] : "all"),
    onSettled: () => setBusyKind(null),

    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["brandCollateral", snapshot.id] });
      const failed = res?.failed ?? [];
      const arch = res?.artDirection?.archetype;
      const issues = res?.qcIssues ?? [];
      if (failed.length) toast.warning(`Generated with ${failed.length} skipped: ${failed.map((f: any) => f.kind).join(", ")}`);
      else if (issues.length) {
        toast.warning(`${issues.length} page${issues.length === 1 ? "" : "s"} failed the print check`, {
          description: issues.slice(0, 3).map((i: any) => `${i.page}: ${i.reasons[0]}`).join("  ·  "),
        });
      } else toast.success(arch ? `Collateral generated — art direction: ${String(arch).replace(/_/g, " ")}.` : "Collateral generated.");
    },
    onError: (e: any) => {
      // Missing text is a fixable gap, not a failure — send them to the form.
      if (e?.code === "DETAILS_INCOMPLETE") {
        toast.warning(e.message);
        setDetailsOpen(true);
        return;
      }
      toast.error(e.message || "Generation failed");
    },
  });

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
    onSuccess: () => {
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
      <div className="rounded-xl border border-white/10 bg-background/40 p-4">
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
                <Button size="sm" variant="ghost" onClick={onClearAll} disabled={wipe.isPending}>
                  <RotateCcw className="mr-1 h-3 w-3" />Clear
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadCollateralZip(items, snapshot?.company_name)}>
                  <Download className="mr-1 h-3 w-3" />Download ZIP
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => requestGen(undefined)} disabled={!locked || gen.isPending}>
              {busyKind === "all" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
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

      {COLLATERAL_TIERS.map((tier) => {
        const doneInTier = tier.kinds.filter((k) => (byKind[k.kind] ?? []).length > 0).length;
        return (
          <div key={tier.tier} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
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
                  busy={busyKind === k.kind || (busyKind === "all" && gen.isPending)}
                  canGenerate={!!locked}
                  disabled={!locked || gen.isPending}
                  onPreview={() => setOpenKind(k.kind)}
                  onGenerate={() => requestGen([k.kind])}
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

