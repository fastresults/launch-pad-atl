import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTestimonialSettings,
  listPublishedTestimonials,
  type TestimonialWithUrls,
} from "@/lib/testimonials.functions";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoTestimonials() {
  const { data: settings } = useQuery({
    queryKey: ["testimonial_settings"],
    queryFn: getTestimonialSettings,
    staleTime: 5 * 60_000,
  });
  const { data: items = [] } = useQuery({
    queryKey: ["testimonials_published"],
    queryFn: listPublishedTestimonials,
    staleTime: 5 * 60_000,
  });

  const enabled = settings?.enabled ?? true;
  if (!enabled || items.length === 0) return null;

  return <Slider items={items} settings={settings!} />;
}

function Slider({
  items,
  settings,
}: {
  items: TestimonialWithUrls[];
  settings: NonNullable<Awaited<ReturnType<typeof getTestimonialSettings>>>;
}) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(settings.start_muted);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const next = useCallback(() => {
    setIndex((i) => {
      const n = i + 1;
      if (n >= items.length) return settings.loop ? 0 : i;
      return n;
    });
  }, [items.length, settings.loop]);

  const prev = useCallback(() => {
    setIndex((i) => {
      const n = i - 1;
      if (n < 0) return settings.loop ? items.length - 1 : 0;
      return n;
    });
  }, [items.length, settings.loop]);

  // Clear any pending advance timer
  const clearAdvance = () => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  // Manage play/pause based on hover/paused state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hover || paused || reducedMotion || !settings.autoplay) {
      v.pause();
      clearAdvance();
    } else {
      v.play().catch(() => {/* autoplay blocked */});
    }
  }, [hover, paused, index, reducedMotion, settings.autoplay]);

  // When current video ends, wait pause_seconds then advance
  const onEnded = () => {
    clearAdvance();
    if (hover || paused || !settings.autoplay || reducedMotion) return;
    advanceTimer.current = window.setTimeout(() => {
      next();
    }, Math.max(0, settings.pause_seconds) * 1000);
  };

  useEffect(() => () => clearAdvance(), []);

  const current = items[index];

  return (
    <section className="relative border-b border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 text-center md:mb-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {settings.heading}
          </h2>
          {settings.subheading && (
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {settings.subheading}
            </p>
          )}
        </div>

        <div
          className={cn(
            "relative mx-auto overflow-hidden rounded-2xl bg-black shadow-xl",
            !settings.show_on_mobile && "hidden md:block",
          )}
          style={{ maxWidth: 880 }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
        >
          <div className="relative aspect-video w-full bg-black">
            <video
              key={current.id}
              ref={videoRef}
              src={current.video_url ?? undefined}
              poster={current.poster_url ?? undefined}
              muted={muted}
              autoPlay={settings.autoplay && !reducedMotion}
              playsInline
              preload="metadata"
              onEnded={onEnded}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Caption overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-6">
              <div className="text-white">
                <div className="text-sm font-medium md:text-base">
                  {current.founder_name}
                  {current.founder_role && (
                    <span className="text-white/80"> · {current.founder_role}</span>
                  )}
                </div>
                {current.startup_name && (
                  <div className="text-xs text-white/80 md:text-sm">{current.startup_name}</div>
                )}
                {current.quote && (
                  <p className="mt-2 max-w-2xl text-sm italic text-white/90 md:text-base">
                    "{current.quote}"
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
                aria-label={paused ? "Play" : "Pause"}
              >
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
            </div>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="flex items-center justify-center gap-2 bg-black/90 py-3">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
