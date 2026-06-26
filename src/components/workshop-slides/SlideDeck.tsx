import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, LayoutGrid, X, Home } from "lucide-react";
import { ScaledSlide } from "./ScaledSlide";

export type Slide = {
  id: string;
  title: string; // for grid/thumbnail
  render: () => ReactNode;
};

type Props = {
  stageTitle: string;
  slides: Slide[];
  exitTo?: string;
};

export function SlideDeck({ stageTitle, slides, exitTo = "/dashboard/day" }: Props) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const slideParam = Number(params.get("slide") ?? "1");
  const initial = Number.isFinite(slideParam) ? Math.min(Math.max(slideParam, 1), slides.length) : 1;
  const [index, setIndex] = useState(initial - 1);
  const [showGrid, setShowGrid] = useState(false);
  const [isFs, setIsFs] = useState(false);

  const goto = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), slides.length - 1);
      setIndex(next);
      const p = new URLSearchParams(params);
      p.set("slide", String(next + 1));
      setParams(p, { replace: true });
    },
    [slides.length, params, setParams]
  );

  useEffect(() => {
    document.title = `${index + 1}/${slides.length} — ${slides[index]?.title} · ${stageTitle}`;
  }, [index, slides, stageTitle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goto(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(index - 1);
      } else if (e.key === "g" || e.key === "G") {
        setShowGrid((v) => !v);
      } else if (e.key === "f" || e.key === "F") {
        toggleFs();
      } else if (e.key === "Escape") {
        if (showGrid) setShowGrid(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goto, showGrid]);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const current = slides[index];

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-neutral-900 text-white/80 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={exitTo} className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10" title="Back to dashboard">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <span className="opacity-50">/</span>
          <span className="truncate font-medium">{stageTitle}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowGrid((v) => !v)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10" title="Grid (G)">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={toggleFs} className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10" title="Present (F)">
            {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => navigate(exitTo)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10" title="Exit">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide stage */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <ScaledSlide>{current?.render()}</ScaledSlide>

        {/* Side nav */}
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
          disabled={index === slides.length - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Bottom progress pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium">
          {index + 1} / {slides.length}
        </div>
      </div>

      {/* Grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 z-50 bg-neutral-950/95 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white text-lg font-semibold">{stageTitle} — all slides</div>
            <button onClick={() => setShowGrid(false)} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  goto(i);
                  setShowGrid(false);
                }}
                className={`group text-left rounded-lg overflow-hidden border ${
                  i === index ? "border-primary ring-2 ring-primary" : "border-white/10 hover:border-white/40"
                }`}
              >
                <div className="relative aspect-video bg-white overflow-hidden">
                  <ScaledSlide>{s.render()}</ScaledSlide>
                </div>
                <div className="px-3 py-2 bg-neutral-900 text-white">
                  <div className="text-xs opacity-60">Slide {i + 1}</div>
                  <div className="text-sm font-medium truncate">{s.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
