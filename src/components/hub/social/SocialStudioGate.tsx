// @ts-nocheck
import { useState } from "react";
import { Lock, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWizard } from "@/components/hub/brand-wizard/BrandWizard";

export function SocialStudioGate({ snapshot, kit }: { snapshot: any; kit: any }) {
  const [open, setOpen] = useState(false);
  const isDraft = kit?.status === "draft";

  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Lock your brand first</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Every social asset — avatars, covers, pinned posts, thumbnails — inherits your palette
            roles, type pairing, logo, and voice from your <b>Brand Kit</b>. Social Studio engages
            the moment your Brand Wizard is locked.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>
              <Sparkles className="mr-1 h-3 w-3" />
              {isDraft ? "Resume Brand Wizard" : "Open Brand Wizard"}
            </Button>
            {kit && (
              <span className="text-[11px] text-muted-foreground">
                Step {kit.step ?? 1} / 5 · {isDraft ? "draft" : "not started"}
              </span>
            )}
          </div>
        </div>
        <Palette className="h-5 w-5 shrink-0 text-muted-foreground/60" />
      </div>
      <BrandWizard snapshot={snapshot} open={open} onOpenChange={setOpen} />
    </div>
  );
}
