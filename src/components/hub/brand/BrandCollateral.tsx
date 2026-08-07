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
    mutationFn: (kinds?: string[]) => generateCollateral(snapshot.id, kinds),
    onMutate: (kinds) => setBusyKind(kinds?.length === 1 ? kinds[0] : "all"),
    onSettled: () => setBusyKind(null),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["brandCollateral", snapshot.id] });
      const failed = res?.failed ?? [];
      if (failed.length) toast.warning(`Generated with ${failed.length} skipped: ${failed.map((f: any) => f.kind).join(", ")}`);
      else toast.success("Collateral generated.");
    },
    onError: (e: any) => toast.error(e.message || "Generation failed"),
  });

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

  const previewOf = (kind: string) =>
    (byKind[kind] ?? []).find((i) => i.mime_type === "image/png")?.url ?? null;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-primary" />
            Brand collateral
            <Badge variant="outline" className="text-[10px]">{items.length} files</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Print and office pieces typeset directly from your locked palette, typography and vector mark — no AI guesswork on the type.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button size="sm" onClick={() => gen.mutate(undefined)} disabled={!locked || gen.isPending}>
            {busyKind === "all" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            Generate all
          </Button>
        </div>
      </div>

      {!locked && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
          Lock your brand kit (palette, typography and a saved vector logo) first — collateral is typeset around the mark.
        </p>
      )}

      {COLLATERAL_TIERS.map((tier) => (
        <div key={tier.tier} className="space-y-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tier.label}</div>
            <p className="text-[11px] text-muted-foreground">{tier.blurb}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tier.kinds.map((k) => {
              const files = byKind[k.kind] ?? [];
              const preview = previewOf(k.kind);
              return (
                <div key={k.kind} className="flex gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
                  <button
                    type="button"
                    onClick={() => setOpenKind(k.kind)}
                    aria-label={`Preview ${k.label}`}
                    className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-white transition hover:ring-2 hover:ring-primary"
                  >
                    {preview
                      ? <img src={preview} alt={k.label} className="h-full w-full object-contain" loading="lazy" />
                      : <Package className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setOpenKind(k.kind)}
                      className="flex items-center gap-1.5 text-left"
                    >
                      <span className="truncate text-sm font-medium hover:underline">{k.label}</span>
                      {files.length > 0 && <Badge variant="secondary" className="text-[10px]">{files.length}</Badge>}
                    </button>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{k.note}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => setOpenKind(k.kind)}
                      >
                        <Eye className="mr-1 h-3 w-3" />Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px]"
                        disabled={!locked || gen.isPending}
                        onClick={() => gen.mutate([k.kind])}
                      >
                        {busyKind === k.kind ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        {files.length ? "Regenerate" : "Generate"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <CollateralPreviewDialog
        open={!!openKind}
        onOpenChange={(v) => setOpenKind(v ? openKind : null)}
        kind={openMeta}
        files={openKind ? (byKind[openKind] ?? []) : []}
        busy={gen.isPending && (busyKind === openKind || busyKind === "all")}
        canGenerate={!!locked}
        onRegenerate={() => openKind && gen.mutate([openKind])}
        onClear={async () => {
          if (!openKind) return;
          if (await confirm({ title: `Clear ${openMeta?.label ?? "this piece"}?`, description: "The generated files for this piece are removed. You can regenerate at any time.", destructive: true, confirmText: "Clear" })) {
            wipe.mutate(openKind);
          }
        }}
      />
    </div>
  );
}

