// @ts-nocheck
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Lock, RotateCcw } from "lucide-react";
import { getBrandKit, resetBrandKit, upsertBrandKit } from "@/lib/brandKit.functions";
import { BrandWizard } from "@/components/hub/brand-wizard/BrandWizard";
import { EditablePaletteSwatch } from "@/components/hub/brand/EditablePaletteSwatch";
import { toast } from "sonner";

export function BrandStudio({ snapshot }: { snapshot: any }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const kitQ = useQuery({
    queryKey: ["brandKit", snapshot.id],
    queryFn: () => getBrandKit(snapshot.id),
  });
  const kit = kitQ.data;
  const locked = kit?.status === "locked";

  const reset = useMutation({
    mutationFn: () => resetBrandKit(snapshot.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
      toast.success("Brand wizard reset. Start fresh whenever you're ready.");
    },
    onError: (e: any) => toast.error(e.message || "Reset failed"),
  });

  const onReset = () => {
    const label = locked ? "This will delete your locked brand kit (palette, typography, logos, moodboard, style guide). Continue?" : "This will discard your current wizard progress. Continue?";
    if (window.confirm(label)) reset.mutate();
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Brand Studio</h3>
          {locked && (
            <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" />Locked</Badge>
          )}
          {!locked && kit && (
            <Badge variant="outline" className="text-[10px]">Step {kit.step ?? 1} / 5</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {kit && (
            <Button size="sm" variant="ghost" onClick={onReset} disabled={reset.isPending} title="Reset & start over">
              <RotateCcw className="mr-1 h-3 w-3" />Reset
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(true)}>
            <Sparkles className="mr-1 h-3 w-3" />
            {kit ? (locked ? "Edit brand" : "Resume wizard") : "Start brand wizard"}
          </Button>
        </div>
      </div>

      {!kit && (
        <p className="text-xs text-muted-foreground">
          A 5-step guided wizard: brand DNA → palette → typography → moodboard & logo → voice & style guide.
          You pick the direction at every step. The final style guide saves to your <b>My Files</b>.
        </p>
      )}

      {kit && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Palette</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {kit.palette?.colors ? Object.entries(kit.palette.colors).map(([k, v]: any) => (
                <div key={k} className="flex items-center gap-1 rounded-full border border-white/10 bg-background/40 px-2 py-0.5 text-[10px]">
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: v }} />
                  <span className="text-muted-foreground">{k}</span>
                </div>
              )) : <span className="text-xs text-muted-foreground">Not chosen yet</span>}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Typography</div>
            <div className="mt-1 text-xs">
              <div className="font-semibold">{kit.typography?.heading?.family ?? "—"}</div>
              <div className="text-muted-foreground">{kit.typography?.body?.family ?? "—"}</div>
            </div>
          </div>
        </div>
      )}

      {Array.isArray(kit?.logos) && kit.logos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-2">
          {kit.logos.slice(0, 4).map((a: any, i: number) => (
            a.url ? <img key={i} src={a.url} className="aspect-square w-full rounded border border-white/10 object-cover" /> : null
          ))}
        </div>
      )}

      <BrandWizard snapshot={snapshot} open={open} onOpenChange={setOpen} />
    </div>
  );
}
