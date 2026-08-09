// @ts-nocheck
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Lock, RotateCcw, RefreshCw, Loader2, Eye } from "lucide-react";
import { getBrandKit, resetBrandKit, upsertBrandKit } from "@/lib/brandKit.functions";
import { BrandWizard } from "@/components/hub/brand-wizard/BrandWizard";
import { BrandIdentityHeader } from "@/components/hub/brand/BrandIdentityHeader";
import { BrandCollateral } from "@/components/hub/brand/BrandCollateral";
import { BrandBoardSections } from "@/components/brand/BrandBoardSections";
import { kitToBrandBoard } from "@/lib/brand-board";
import { SectionHeader } from "@/components/hub/SectionHeader";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";


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
              <Button size="sm" variant="ghost" onClick={onReset} disabled={reset.isPending} title="Reset & start over">
                <RotateCcw className="mr-1 h-3 w-3" />Reset
              </Button>
            )}
            <Button size="sm" onClick={() => setOpen(true)}>
              <Sparkles className="mr-1 h-3 w-3" />
              {kit ? (locked ? "Edit brand" : "Resume wizard") : "Start brand wizard"}
            </Button>
          </>
        }
      />
      {expanded && (
        <div id="brand-studio-panel-body" className="space-y-6 rounded-2xl border border-white/10 bg-card p-5">
          {!kit && (
            <div className="rounded-xl border border-dashed border-white/15 bg-background/40 p-5 text-center">
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
              <div className="border-t border-white/10" />
              <BrandBoardSections
                board={kitToBrandBoard(kit)}
                blocks={["mood", "dna", "voice", "ctas"]}
                onImageClick={(url, caption) => setLightbox({ url, caption })}
                emptyHint="Mood board, brand DNA, voice and calls to action appear here once you complete steps 3–5 of the brand wizard."
              />
              <div className="border-t border-white/10" />
            </>
          )}



          <BrandCollateral snapshot={snapshot} locked={locked} />
        </div>
      )}


      <BrandWizard snapshot={snapshot} open={open} onOpenChange={setOpen} />

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-card p-3">
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
    </div>

  );
}
