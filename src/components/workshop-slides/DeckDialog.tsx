import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { ScaledSlide } from "./ScaledSlide";
import { getDeck } from "./registry";
import { DeckOverridesProvider } from "./slots";
import { fetchDeckOverrides } from "@/lib/deck-overrides.functions";

type Props = {
  slug: string | null;
  onOpenChange: (open: boolean) => void;
};

export function DeckDialog({ slug, onOpenChange }: Props) {
  const deck = slug ? getDeck(slug) : undefined;
  const slides = deck?.slides ?? [];
  const [index, setIndex] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: overrides = {} } = useQuery({
    queryKey: ["deck-overrides", slug],
    queryFn: () => fetchDeckOverrides(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  useEffect(() => {
    setIndex(0);
  }, [slug]);

  const goto = useCallback(
    (i: number) => {
      setIndex(Math.min(Math.max(i, 0), Math.max(slides.length - 1, 0)));
    },
    [slides.length],
  );

  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goto(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goto(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goto(slides.length - 1);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, index, goto, slides.length, toggleFullscreen]);

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2800);
  }, []);

  useEffect(() => {
    if (!slug) return;
    bumpChrome();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [slug, index, bumpChrome]);

  const current = slides[index];
  const progress = slides.length ? ((index + 1) / slides.length) * 100 : 0;

  return (
    <Dialog open={!!slug} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[96vw] w-[96vw] h-[92vh] p-0 gap-0 overflow-hidden bg-background border-border flex flex-col"
      >
        <DialogTitle className="sr-only">{deck?.title ?? "Facilitator deck"}</DialogTitle>

        <div
          ref={stageRef}
          onMouseMove={bumpChrome}
          className="relative flex-1 min-h-0 bg-black overflow-hidden"
          aria-label="Facilitator deck"
        >
          {/* Top bar */}
          <div
            className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-b from-black/70 to-transparent text-white transition-opacity duration-300 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <span className="truncate text-sm font-medium">{deck?.title}</span>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span>
                Slide {index + 1} / {slides.length}
              </span>
              <span className="hidden sm:inline opacity-60">←/→ navigate · F fullscreen · Esc close</span>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-md hover:bg-white/10"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Slide stage */}
          <div className="absolute inset-0">
            <ScaledSlide key={index}>{current?.render()}</ScaledSlide>
          </div>

          {/* Live region for screen readers */}
          <div className="sr-only" aria-live="polite">
            Slide {index + 1} of {slides.length}
          </div>

          {/* Nav buttons */}
          <button
            onClick={() => goto(index - 1)}
            disabled={index === 0}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-opacity duration-300 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => goto(index + 1)}
            disabled={index >= slides.length - 1}
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-opacity duration-300 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Progress bar (always visible, thin) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Thumbnail rail (desktop only) */}
        <div className="hidden md:flex shrink-0 items-center gap-2 px-4 py-3 bg-neutral-950 border-t border-white/10 overflow-x-auto">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              className={`relative shrink-0 w-[160px] h-[90px] rounded-md overflow-hidden border-2 transition ${
                i === index
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-white/10 hover:border-white/30"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              <div className="absolute inset-0 bg-black">
                <ScaledSlide>{s.render()}</ScaledSlide>
              </div>
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
