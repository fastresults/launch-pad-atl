// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Globe, Sparkles, Upload, Wand2 } from "lucide-react";

export function Step1TrackPicker({
  kit,
  onPick,
}: {
  kit: any;
  onPick: (track: "existing" | "new") => void;
}) {
  const current = kit?.dna?.track as "existing" | "new" | undefined;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">How should we build your brand?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a path. You can reset and switch tracks any time from the Brand Studio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => onPick("existing")}
          className={`group rounded-xl border p-5 text-left transition hover:border-primary hover:bg-primary/5 ${
            current === "existing" ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-2 text-primary">
            <Globe className="h-5 w-5" />
            <Upload className="h-5 w-5" />
          </div>
          <div className="mt-3 text-base font-semibold">I already have a brand</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your logo and paste your website. We'll extract your real colors, typography, and voice — then turn it into a full style guide.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>• Dropzone for your logo (PNG / SVG / JPG)</li>
            <li>• Live site scrape via Firecrawl</li>
            <li>• Edit anything we get wrong before locking</li>
          </ul>
          <div className="mt-4">
            <Button size="sm" variant={current === "existing" ? "default" : "outline"}>
              Use my existing brand
            </Button>
          </div>
        </button>

        <button
          onClick={() => onPick("new")}
          className={`group rounded-xl border p-5 text-left transition hover:border-primary hover:bg-primary/5 ${
            current === "new" ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-2 text-primary">
            <Wand2 className="h-5 w-5" />
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="mt-3 text-base font-semibold">Help me build one from scratch</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Walk through the 5-step generative wizard: brand DNA → palette → typography → moodboard & logo → voice & style guide.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>• AI-proposed palettes and font pairings</li>
            <li>• Logo concepts inspired by your references</li>
            <li>• Locked style guide at the end</li>
          </ul>
          <div className="mt-4">
            <Button size="sm" variant={current === "new" ? "default" : "outline"}>
              Build from scratch
            </Button>
          </div>
        </button>
      </div>
    </div>
  );
}
