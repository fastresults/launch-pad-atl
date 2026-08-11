// @ts-nocheck
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ArrowRight, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { extractExistingBrand, upsertBrandKit } from "@/lib/brandKit.functions";

const downscaleToDataUrl = (file: File, max = 768): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const src = reader.result as string;
      if (file.type === "image/svg+xml" || file.size < 200 * 1024) return resolve(src);
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        try {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(src);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/png"));
        } catch { resolve(src); }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

export function ExistingBrandIntake({
  snapshot,
  kit,
  onBack,
  onExtracted,
}: {
  snapshot: any;
  kit: any;
  onBack: () => void;
  onExtracted: () => void;
}) {
  const qc = useQueryClient();
  const [websiteUrl, setWebsiteUrl] = useState<string>(kit?.dna?.source_url ?? "");
  const [voiceNotes, setVoiceNotes] = useState<string>(kit?.dna?.voice_notes ?? "");
  const [logos, setLogos] = useState<{ dataUrl: string; filename: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const onDropLogos = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4 - logos.length);
    if (!arr.length) {
      toast.error("Please drop image files (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrls = await Promise.all(
        arr.map(async (f) => ({ dataUrl: await downscaleToDataUrl(f), filename: f.name })),
      );
      setLogos((prev) => [...prev, ...dataUrls].slice(0, 4));
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    }
  };

  const extract = useMutation({
    mutationFn: async () => {
      if (!logos.length && !websiteUrl.trim()) {
        throw new Error("Drop at least one logo or add your website URL.");
      }
      // Persist intake metadata so it's restorable.
      await upsertBrandKit(snapshot.id, {
        dna: { ...(kit?.dna ?? {}), track: "existing", source_url: websiteUrl.trim() || null, voice_notes: voiceNotes.trim() || null },
      });
      return extractExistingBrand(snapshot.id, {
        websiteUrl: websiteUrl.trim() || undefined,
        logos,
        voiceNotes: voiceNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Brand extracted — review and lock when ready");
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
      onExtracted();
    },
    onError: (e: any) => toast.error(e?.message || "Extraction failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tell us about your existing brand</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop your logo and (ideally) paste your live website. We'll pull your colors, typography, and voice from what already exists.
        </p>
      </div>

      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Your logo · up to 4 files</Label>
        <label
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); if (logos.length < 4) setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (logos.length < 4) onDropLogos(e.dataTransfer?.files ?? null); }}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
            multiple
            className="hidden"
            onChange={(e) => { onDropLogos(e.target.files); e.currentTarget.value = ""; }}
            disabled={logos.length >= 4}
          />
          <div className="text-sm font-medium">
            {logos.length >= 4 ? "4 logos added — you're set" : "Drag & drop or click to upload"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, SVG, WEBP · primary logo + variations · {logos.length}/4
          </div>
        </label>
        {logos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {logos.map((l, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-white">
                <img src={l.dataUrl} className="h-full w-full object-contain" alt={l.filename} />
                <button
                  onClick={() => setLogos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-white hover:bg-black/80"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Your live website</Label>
        <Input
          type="url"
          placeholder="https://yourbrand.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          We'll scan the homepage to pull your real palette, typography, voice, and a screenshot for your moodboard.
        </p>
      </section>

      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Voice notes (optional)</Label>
        <Textarea
          rows={3}
          placeholder="Any words you always / never use, taglines, things to call your customer, tone reminders…"
          value={voiceNotes}
          onChange={(e) => setVoiceNotes(e.target.value)}
        />
      </section>

      <div className="sticky bottom-0 z-20 -mx-6 -mb-8 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/95 px-6 py-4 shadow-lg backdrop-blur">
        <Button variant="ghost" onClick={onBack} disabled={extract.isPending}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => extract.mutate()} disabled={extract.isPending || (logos.length === 0 && !websiteUrl.trim())}>
          {extract.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
          Analyze my brand <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
