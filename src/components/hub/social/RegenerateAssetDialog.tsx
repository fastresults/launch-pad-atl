// @ts-nocheck
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";

const QUICK_NOTES = [
  "Lighter background",
  "Stronger logo presence",
  "More whitespace",
  "Higher contrast",
  "Less saturated",
  "Different composition",
];

const DIRECTIONS = [
  { id: "editorial", label: "Editorial" },
  { id: "photographic", label: "Photographic" },
  { id: "geometric", label: "Geometric" },
  { id: "illustrative", label: "Illustrative" },
];

const INTENSITIES = [
  { id: "subtle", label: "Subtle", hint: "Restrained brand-color moment" },
  { id: "balanced", label: "Balanced", hint: "Anchoring brand splash (default)" },
  { id: "bold", label: "Bold", hint: "Brand color is the hero element" },
] as const;

const PLACEMENTS = [
  { id: "auto", label: "Auto (recommended)" },
  { id: "anchor_block", label: "Anchor block / quadrant" },
  { id: "sidebar_stripe", label: "Sidebar / folio stripe" },
  { id: "duotone_wash", label: "Duotone wash over subject" },
  { id: "focal_shape", label: "Fill the focal shape" },
  { id: "corner_mark", label: "Corner / folio mark" },
  { id: "framed_border", label: "Framed border" },
] as const;

export function RegenerateAssetDialog({
  open,
  onOpenChange,
  scope, // "single" | "all"
  targetLabel,
  thumbnailUrl,
  currentDirection,
  canvasPlan,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: "single" | "all";
  targetLabel: string;
  thumbnailUrl?: string | null;
  currentDirection: string;
  canvasPlan?: { surface?: string; ink?: string; accent?: string; signature?: string; displaySignature?: string } | null;
  onSubmit: (input: {
    feedback: string;
    directionOverride?: string;
    signatureIntensity?: "subtle" | "balanced" | "bold";
    signaturePlacement?: typeof PLACEMENTS[number]["id"];
  }) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [direction, setDirection] = useState<string>(currentDirection);
  const [intensity, setIntensity] = useState<"subtle" | "balanced" | "bold">("balanced");
  const [placement, setPlacement] = useState<typeof PLACEMENTS[number]["id"]>("auto");
  const [busy, setBusy] = useState(false);

  const addQuick = (note: string) => {
    setFeedback((prev) => (prev ? `${prev}\n• ${note}` : `• ${note}`));
  };

  const submit = async () => {
    setBusy(true);
    // Fire-and-forget so the user can close the modal and let the task run in the background.
    const payload = {
      feedback: feedback.trim(),
      directionOverride: direction !== currentDirection ? direction : undefined,
      signatureIntensity: intensity,
      signaturePlacement: placement,
    };
    Promise.resolve()
      .then(() => onSubmit(payload))
      .catch(() => { /* parent surfaces errors via toast */ })
      .finally(() => setBusy(false));
    setFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {scope === "all" ? "Regenerate all assets" : `Regenerate ${targetLabel}`}
          </DialogTitle>
          <DialogDescription>
            Tell the art director what's off-brand. Your notes are passed verbatim to the next render.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {scope === "single" && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40 flex items-center justify-center">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="current" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{targetLabel}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{currentDirection}</Badge>
                  {canvasPlan && (
                    <div className="flex items-center gap-0.5">
                      <span className="h-3 w-3 rounded-sm border border-border" style={{ background: canvasPlan.surface }} />
                      <span className="h-3 w-3 rounded-sm border border-border" style={{ background: canvasPlan.ink }} />
                      <span className="h-3 w-3 rounded-sm border border-border" style={{ background: canvasPlan.accent }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium">What's off?</label>
            <Textarea
              rows={4}
              placeholder="e.g. background too dark, logo too small, less purple, more editorial feel"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 600))}
              disabled={busy}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addQuick(n)}
                  disabled={busy}
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
                >
                  + {n}
                </button>
              ))}
            </div>
          </div>

          {scope === "single" && (
            <div>
              <label className="mb-1 block text-xs font-medium">Style for this asset (optional)</label>
              <Select value={direction} onValueChange={setDirection} disabled={busy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Overrides the global style for just this asset.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">Brand signature color</div>
              {(canvasPlan?.displaySignature || canvasPlan?.signature) && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-sm border border-border"
                    style={{ background: canvasPlan?.displaySignature || canvasPlan?.signature }}
                  />
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {(canvasPlan?.displaySignature || canvasPlan?.signature)?.replace("#", "")}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">Intensity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {INTENSITIES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setIntensity(opt.id)}
                    className={`rounded-md border px-2 py-1.5 text-left transition ${
                      intensity === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    title={opt.hint}
                  >
                    <div className="text-[11px] font-medium">{opt.label}</div>
                    <div className="text-[9px] text-muted-foreground line-clamp-1">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">Placement</label>
              <Select value={placement} onValueChange={(v: any) => setPlacement(v)} disabled={busy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Where the brand color appears in the composition. "Auto" lets the art director pick based on style.
              </p>
            </div>
          </div>
        </div>


        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
