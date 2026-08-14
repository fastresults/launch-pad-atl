// @ts-nocheck
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Lock, LockOpen, RotateCcw, RefreshCw, Loader2, Eye } from "lucide-react";
import { getBrandKit, resetBrandKit, upsertBrandKit, generateStyleGuide, setBrandKitLock } from "@/lib/brandKit.functions";
import { useAuth } from "@/hooks/use-auth";
import { BrandWizard } from "@/components/hub/brand-wizard/BrandWizard";
import { BrandIdentityHeader } from "@/components/hub/brand/BrandIdentityHeader";
import { BrandCollateral } from "@/components/hub/brand/BrandCollateral";
import { BrandBoardSections } from "@/components/brand/BrandBoardSections";
import { kitToBrandBoard } from "@/lib/brand-board";
import { SectionHeader } from "@/components/hub/SectionHeader";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useWebsitePrd } from "@/components/hub/brand/use-website-prd";
import { useMoodboard } from "@/components/hub/brand/use-moodboard";
import { PrdExportActions } from "@/components/hub/brand/PrdExportActions";
import { DocumentViewer } from "@/components/hub/DocumentViewer";



export function BrandStudio({ snapshot }: { snapshot: any }) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string | null } | null>(null);

  const qc = useQueryClient();
  const confirm = useConfirm();
  const kitQ = useQuery({
    queryKey: ["brandKit", snapshot.id],
    queryFn: () => getBrandKit(snapshot.id),
  });
  const kit = kitQ.data;
  const locked = kit?.status === "locked";
  const [expanded, setExpanded] = useState(!locked);
  const [prdOpen, setPrdOpen] = useState(false);
  const websitePrd = useWebsitePrd(snapshot.id, kit?.locked_at ?? null, locked);
  const mood = useMoodboard(snapshot.id);



  const lockBlockedReason = (() => {
    const missing = [!kit?.palette && "a palette", !kit?.typography && "typography"].filter(Boolean) as string[];
    return missing.length ? `Pick ${missing.join(" and ")} in the wizard first` : null;
  })();

  const lockKit = useMutation({
    mutationFn: () => generateStyleGuide(snapshot.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
      toast.success("Brand kit locked — style guide generated");
    },
    onError: (e: any) => toast.error(e.message || "Lock failed"),
  });

  const setLock = useMutation({
    mutationFn: (next: boolean) => setBrandKitLock(snapshot.id, next),
    onSuccess: (_d, next) => {
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
      toast.success(next ? "Brand kit locked" : "Brand kit unlocked — it's editable again");
    },
    onError: (e: any) => toast.error(e.message || "Could not change the lock"),
  });


  const reset = useMutation({
    mutationFn: () => resetBrandKit(snapshot.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
      toast.success("Brand wizard reset. Start fresh whenever you're ready.");
    },
    onError: (e: any) => toast.error(e.message || "Reset failed"),
  });


  const onReset = async () => {
    const description = locked
      ? "This will delete your locked brand kit (palette, typography, logos, moodboard, style guide)."
      : "This will discard your current wizard progress.";
    if (await confirm({ title: "Reset brand wizard?", description, destructive: true, confirmText: "Reset" })) reset.mutate();
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        cat="Brand Studio"
        index={0}
        done={locked ? 5 : (kit?.step ?? 0)}
        total={5}
        isOpen={expanded}
        onToggle={() => setExpanded((v) => !v)}
        contentId="brand-studio-panel-body"
        status={locked ? "complete" : kit ? "in_progress" : "not_started"}
        icon={Palette}
        label="Brand Studio"
        tagline="Lock palette, typography & logo — powers Website PRD"
        accentVar="--brand-violet"
        badges={
          <>
            {locked && (
              <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" />Locked</Badge>
            )}
            {!locked && kit && (
              <Badge variant="outline" className="text-[10px]">Step {kit.step ?? 1} / 5</Badge>
            )}
          </>
        }
        actions={
          <>
            {kit && (
              <Button size="sm" variant="ghost" onClick={() => mood.regenerate.mutate()} disabled={mood.running} title="Rebuild the 9-tile mood board">
                {mood.running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                {mood.running ? mood.label : (Array.isArray(kit?.moodboard) && kit.moodboard.length ? "Regenerate mood board" : "Generate mood board")}
              </Button>
            )}
            {kit && (
              <Button size="sm" variant="ghost" onClick={onReset} disabled={reset.isPending} title="Reset & start over">
                <RotateCcw className="mr-1 h-3 w-3" />Reset
              </Button>
            )}
            <Button size="sm" variant={kit && !locked ? "outline" : "default"} onClick={() => setOpen(true)}>
              <Sparkles className="mr-1 h-3 w-3" />
              {kit ? (locked ? "Edit brand" : "Resume wizard") : "Start brand wizard"}
            </Button>
            {kit && !locked && (
              <Button
                size="sm"
                onClick={() => (lockBlockedReason ? setOpen(true) : lockKit.mutate())}
                disabled={lockKit.isPending}
                title={lockBlockedReason ?? "Lock the brand kit and write the style guide"}
              >
                {lockKit.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Lock className="mr-1 h-3 w-3" />}
                {lockKit.isPending ? "Locking…" : "Lock brand kit"}
              </Button>
            )}
            {isAdmin && kit && locked && (
              <Button
                size="sm"
                onClick={onUnlock}
                disabled={setLock.isPending}
                title="Admin: unlock the brand kit so palette, type and marks can be edited again"
              >
                {setLock.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LockOpen className="mr-1 h-3 w-3" />}
                {setLock.isPending ? "Unlocking…" : "Unlock brand"}
              </Button>
            )}
            {isAdmin && kit && !locked && !lockBlockedReason && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLock.mutate(true)}
                disabled={setLock.isPending || lockKit.isPending}
                title="Admin: lock the kit without regenerating the style guide"
              >
                <Lock className="mr-1 h-3 w-3" />Lock (no rebuild)
              </Button>
            )}

          </>
        }

      />
      {expanded && (
        <div id="brand-studio-panel-body" className="space-y-6 rounded-2xl border border-border bg-card p-5">
          {!kit && (
            <div className="rounded-xl border border-dashed border-border bg-background/40 p-5 text-center">
              <p className="text-sm font-medium">Your identity, locked in five steps</p>
              <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                Brand DNA → palette → typography → moodboard &amp; logo → voice &amp; style guide. You pick the direction at
                every step. When it's locked we typeset your full print kit — cards, letterhead, envelope, invoice,
                guidelines — and feed the same tokens into your Website PRD.
              </p>
              <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
                <Sparkles className="mr-1 h-3 w-3" />Start brand wizard
              </Button>
            </div>
          )}

          {kit && (
            <BrandIdentityHeader
              kit={kit}
              snapshotId={snapshot.id}
              companyName={snapshot?.company_name}
              onEditMark={() => setOpen(true)}
              onChangeColor={async (key, hex) => {
                const nextColors = { ...(kit.palette?.colors ?? {}), [key]: hex };
                await upsertBrandKit(snapshot.id, {
                  palette: { ...(kit.palette ?? {}), colors: nextColors, source: "user-edited" },
                });
                qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
              }}
            />
          )}

          {kit && (
            <>
              <div className="border-t border-border" />
              <BrandBoardSections
                board={kitToBrandBoard(kit)}
                blocks={["mood", "dna", "voice", "ctas"]}
                onImageClick={(url, caption) => setLightbox({ url, caption })}
                emptyHint="Mood board, brand DNA, voice and calls to action appear here once you complete steps 3–5 of the brand wizard."
              />
              <div className="border-t border-border" />
            </>
          )}

          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              !locked
                ? "border-border bg-muted/40"
                : websitePrd.failed
                  ? "border-destructive/40 bg-destructive/5"
                  : websitePrd.stale || !websitePrd.exists
                    ? "border-status-warning/40 bg-status-warning/5"
                    : "border-border bg-background/40"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {!locked
                  ? "Website brief — unlocks after you lock your brand"
                  : websitePrd.building
                    ? "Building your website brief…"
                    : websitePrd.failed
                      ? "Your website brief stopped part-way"
                      : !websitePrd.exists
                        ? "No website brief yet"
                        : websitePrd.stale
                          ? "Your website brief was written before this brand"
                          : "Your website brief matches this brand"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {!locked
                  ? "It's the only asset we hold back from the automatic build — it's written from your final marks, palette and type, so it waits until those are locked."
                  : websitePrd.statusNote
                    ? websitePrd.statusNote
                    : "Building writes the brief and its paste-ready builder prompt from your locked palette, typography and committed mark. No extra input needed."}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {locked && websitePrd.exists && (
                <Button size="sm" variant="outline" onClick={() => setPrdOpen(true)} disabled={websitePrd.running}>
                  <Eye className="mr-1 h-3 w-3" />Read brief
                </Button>
              )}
              {locked && websitePrd.exists && !websitePrd.running && <PrdExportActions doc={websitePrd.prd} />}
              <Button
                size="sm"
                variant={locked && (websitePrd.stale || !websitePrd.exists) ? "default" : "outline"}
                onClick={() => websitePrd.regenerate.mutate(undefined)}
                disabled={!locked || websitePrd.running}
                title={websitePrd.blockedReason ?? undefined}
              >
                {websitePrd.running ? (
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Building…</>
                ) : (
                  <><RefreshCw className="mr-1 h-3 w-3" />{websitePrd.exists ? "Rebuild website brief" : "Build website brief"}</>
                )}
              </Button>
            </div>
          </div>


          <BrandCollateral snapshot={snapshot} kit={kit} locked={locked} />

        </div>
      )}


      <BrandWizard snapshot={snapshot} open={open} onOpenChange={setOpen} />

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-border bg-card p-3">
          <DialogTitle className="sr-only">{lightbox?.caption ?? "Mood board reference"}</DialogTitle>
          {lightbox && (
            <figure className="space-y-2">
              <img
                src={lightbox.url}
                alt={lightbox.caption ?? "Mood board reference"}
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
              {lightbox.caption && (
                <figcaption className="text-center text-xs text-muted-foreground">{lightbox.caption}</figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>

      <DocumentViewer
        doc={prdOpen ? websitePrd.prd : null}
        open={prdOpen && !!websitePrd.prd}
        onOpenChange={(o) => !o && setPrdOpen(false)}
      />
    </div>


  );
}
