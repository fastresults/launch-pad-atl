import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicVideoWall } from "@/lib/video-wall.functions";

type Item = PublicVideoWall["items"][number];

type Props = {
  items: Item[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

export function FounderVideoLightbox({ items, index, onClose, onIndexChange }: Props) {
  const open = index !== null;
  const item = index !== null ? items[index] : null;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && index !== null && index < items.length - 1) {
        onIndexChange(index + 1);
      }
      if (e.key === "ArrowLeft" && index !== null && index > 0) {
        onIndexChange(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, items.length, onIndexChange]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !open) return;
    v.currentTime = 0;
    v.play().catch(() => {
      /* autoplay with sound may be blocked — controls are visible */
    });
  }, [open, item?.id]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[min(94vw,520px)] border-white/10 bg-card p-0 text-foreground">
        {item ? (
          <div className="flex flex-col">
            <div className="relative bg-black">
              <video
                ref={videoRef}
                key={item.id}
                src={item.video_url ?? undefined}
                poster={item.poster_url ?? undefined}
                controls
                playsInline
                className="mx-auto block max-h-[70vh] w-full object-contain"
              />
              {items.length > 1 && index !== null ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous story"
                    disabled={index === 0}
                    onClick={() => onIndexChange(index - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2 text-white/90 backdrop-blur transition hover:bg-black/70 disabled:opacity-25"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next story"
                    disabled={index === items.length - 1}
                    onClick={() => onIndexChange(index + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2 text-white/90 backdrop-blur transition hover:bg-black/70 disabled:opacity-25"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="space-y-2 px-5 py-4">
              <p className="font-serif text-[17px] leading-tight text-foreground">
                {item.founder_name}
                {item.city ? (
                  <span className="text-foreground/50"> · {item.city}</span>
                ) : null}
              </p>
              {item.founder_role || item.startup_name ? (
                <p className="text-[11px] uppercase tracking-[0.14em] text-foreground/45">
                  {[item.founder_role, item.startup_name].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {item.quote ? (
                <p className="sl-quote text-sm leading-relaxed">{item.quote}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
