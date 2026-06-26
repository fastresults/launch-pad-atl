import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScaledSlide } from "./ScaledSlide";
import { getDeck } from "./registry";

type Props = {
  slug: string | null;
  onOpenChange: (open: boolean) => void;
};

export function DeckDialog({ slug, onOpenChange }: Props) {
  const deck = slug ? getDeck(slug) : undefined;
  const slides = deck?.slides ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => { setIndex(0); }, [slug]);

  const goto = useCallback((i: number) => {
    setIndex(Math.min(Math.max(i, 0), Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goto(index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goto(index - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, index, goto]);

  const current = slides[index];

  return (
    <Dialog open={!!slug} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden bg-black border-white/10">
        <DialogTitle className="sr-only">{deck?.title ?? "Facilitator deck"}</DialogTitle>
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-neutral-900 text-white/80 text-sm">
          <span className="truncate font-medium">{deck?.title}</span>
          <span className="text-xs opacity-60">Slide {index + 1} / {slides.length} · ←/→ to navigate</span>
        </div>
        <div className="relative flex-1 overflow-hidden bg-black">
          <ScaledSlide>{current?.render()}</ScaledSlide>
          <button
            onClick={() => goto(index - 1)}
            disabled={index === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => goto(index + 1)}
            disabled={index >= slides.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium">
            {index + 1} / {slides.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
