import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTestimonialSettings,
  listPublishedTestimonials,
  type TestimonialWithUrls,
  type TestimonialSliderSettings,
} from "@/lib/testimonials.functions";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_WIDTH_DESKTOP = 236; // 9:16 → 236 × 420
const CARD_HEIGHT_DESKTOP = 420;
const CARD_GAP = 16;

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

  if (!settings?.enabled || items.length === 0) return null;
  return <Marquee items={items} settings={settings} />;
}

function Marquee({
  items,
  settings,
}: {
  items: TestimonialWithUrls[];
  settings: TestimonialSliderSettings;
}) {
  // Duplicate enough times to comfortably fill > 2× viewport for a seamless loop
  const minRepeats = Math.max(2, Math.ceil((typeof window !== "undefined" ? window.innerWidth : 1400) * 2 / (items.length * (CARD_WIDTH_DESKTOP + CARD_GAP))));
  const loop = useMemo(() => {
    const out: TestimonialWithUrls[] = [];
    for (let i = 0; i < minRepeats; i++) out.push(...items);
    return out;
  }, [items, minRepeats]);

  // One sequence width (single copy of items) — the marquee translates by this distance per cycle
  const sequenceWidth = items.length * (CARD_WIDTH_DESKTOP + CARD_GAP);
  const speed = Math.max(10, Math.min(200, settings.scroll_speed_px_s || 40));
  const durationSec = sequenceWidth / speed;
  const directionSign = settings.direction === "right" ? 1 : -1;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section
      className={cn(
        "relative border-y border-border bg-background py-12 md:py-16",
        !settings.show_on_mobile && "hidden md:block",
      )}
    >
      {/* Heading inside container */}
      <div className="mx-auto mb-8 max-w-6xl px-6 text-center md:mb-10">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {settings.heading}
        </h2>
        {settings.subheading && (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {settings.subheading}
          </p>
        )}
      </div>

      {/* Edge-to-edge strip */}
      <div
        className="group/marquee relative w-full overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div
          className="flex w-max"
          style={
            reducedMotion
              ? { overflowX: "auto" }
              : {
                  gap: `${CARD_GAP}px`,
                  animation: `vt-marquee-${settings.direction} ${durationSec}s linear infinite`,
                  animationPlayState: "running",
                }
          }
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
          }}
        >
          {loop.map((it, i) => (
            <TestimonialCard key={`${it.id}-${i}`} item={it} />
          ))}
        </div>
      </div>

      {/* Keyframes — translate by exactly one sequence width so loop is seamless */}
      <style>{`
        @keyframes vt-marquee-left {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(${directionSign * sequenceWidth}px, 0, 0); }
        }
        @keyframes vt-marquee-right {
          from { transform: translate3d(${-sequenceWidth}px, 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </section>
  );
}

function TestimonialCard({ item }: { item: TestimonialWithUrls }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="group/card relative shrink-0 overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-white/10"
      style={{ width: CARD_WIDTH_DESKTOP, height: CARD_HEIGHT_DESKTOP }}
    >
      <video
        ref={videoRef}
        src={item.video_url ?? undefined}
        poster={item.poster_url ?? undefined}
        muted={muted}
        loop
        autoPlay
        playsInline
        preload="auto"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Live/video indicator */}
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            playing ? "bg-red-500 animate-pulse" : "bg-white/60",
          )}
        />
        Video
      </div>

      {/* Mute toggle (only on hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMuted((m) => {
            const next = !m;
            if (videoRef.current) videoRef.current.muted = next;
            return next;
          });
        }}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover/card:opacity-100"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
      </button>

      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-white">
        <div className="text-sm font-semibold leading-tight">{item.founder_name}</div>
        <div className="text-[11px] text-white/80">
          {[item.founder_role, item.startup_name].filter(Boolean).join(" · ")}
        </div>
        {item.quote && (
          <p className="mt-1.5 line-clamp-2 text-[12px] italic text-white/90">
            "{item.quote}"
          </p>
        )}
      </div>
    </div>
  );
}
