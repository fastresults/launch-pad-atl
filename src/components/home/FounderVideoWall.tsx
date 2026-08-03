import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import {
  DEFAULT_VIDEO_WALL_SETTINGS,
  getPublicVideoWall,
  type PublicVideoWall,
} from "@/lib/video-wall.functions";
import { FounderVideoLightbox } from "@/components/home/FounderVideoLightbox";

function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const HEADING_SIZE: Record<string, string> = {
  xs: "text-[10px] md:text-[11px]",
  sm: "text-[12px] md:text-[13px]",
  md: "text-[15px] md:text-[17px]",
  lg: "text-[20px] md:text-[24px]",
};

const HEADING_WEIGHT: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const HEADING_STYLE: Record<string, string> = {
  label: "font-sans uppercase tracking-[0.18em]",
  serif: "font-serif normal-case tracking-normal",
};

const THUMB: Record<string, { tile: string; badge: string; icon: string }> = {
  xs: { tile: "w-[84px] md:w-[96px]", badge: "h-6 w-6", icon: "h-2.5 w-2.5" },
  sm: { tile: "w-[104px] md:w-[120px]", badge: "h-7 w-7", icon: "h-3 w-3" },
  md: { tile: "w-[132px] md:w-[152px]", badge: "h-8 w-8", icon: "h-3.5 w-3.5" },
  lg: { tile: "w-[160px] md:w-[188px]", badge: "h-10 w-10", icon: "h-4 w-4" },
};

const NAME_STYLE: Record<string, string> = {
  serif: "font-serif normal-case tracking-normal",
  sans: "font-sans normal-case tracking-normal",
  label: "font-sans uppercase tracking-[0.14em]",
  mono: "font-mono normal-case tracking-tight",
};

const NAME_SIZE: Record<string, string> = {
  xs: "text-[11px]",
  sm: "text-[12px]",
  md: "text-[13px]",
  lg: "text-[15px]",
};

const NAME_CASE: Record<string, string> = {
  none: "",
  upper: "uppercase",
  capitalize: "capitalize",
};

const CITY_SIZE: Record<string, string> = {
  xs: "text-[9px]",
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-[12px]",
};

const SUB_SIZE: Record<string, string> = {
  xs: "text-[11px]",
  sm: "text-[12px]",
  md: "text-[14px]",
  lg: "text-[16px]",
};

export function FounderVideoWall() {
  const [data, setData] = useState<PublicVideoWall | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    getPublicVideoWall()
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, []);

  const items = data?.items ?? [];
  const count = items.length;

  if (!data || data.settings.enabled === false || count === 0) return null;

  const s = { ...DEFAULT_VIDEO_WALL_SETTINGS, ...data.settings };
  const headingClass = [
    HEADING_STYLE[s.heading_style] ?? HEADING_STYLE.label,
    HEADING_SIZE[s.heading_size] ?? HEADING_SIZE.xs,
    HEADING_WEIGHT[s.heading_weight] ?? HEADING_WEIGHT.normal,
    "leading-tight text-foreground",
  ].join(" ");
  const thumb = THUMB[s.thumb_size] ?? THUMB.xs;
  const headingOpacity = Math.min(100, Math.max(10, Number(s.heading_opacity) || 50)) / 100;

  const visible = expanded ? items : items.slice(0, 12);
  const hasMore = items.length > visible.length;

  return (
    <section className="border-t border-white/5 py-6 md:py-8" aria-label="Founder video stories">
      <div className="public-container">
        <div className="mb-4 text-center">
          <h2 className={headingClass} style={{ opacity: headingOpacity }}>
            {s.heading}
          </h2>
          {s.show_subheading !== false && s.subheading ? (
            <p className="mx-auto mt-1 max-w-[52ch] text-[11px] leading-relaxed text-foreground/55">
              {s.subheading}
            </p>
          ) : null}
        </div>

        <ul className="flex flex-wrap items-start justify-center gap-3 sm:gap-4">
          {visible.map((item, i) => {
            const dur = formatDuration(item.duration_seconds);
            return (
              <li key={item.id} className={thumb.tile}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label={`Play ${item.founder_name}'s story`}
                >
                  <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25">
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={`${item.founder_name} video thumbnail`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-b from-white/[0.08] to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span
                      className={`absolute left-1/2 top-1/2 flex ${thumb.badge} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 backdrop-blur transition group-hover:bg-primary/80`}
                    >
                      <Play className={`${thumb.icon} translate-x-[1px] fill-current text-white`} />
                    </span>
                    {dur ? (
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-px text-[9px] tabular-nums text-white/85">
                        {dur}
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-1.5 truncate font-serif ${thumb.name} leading-tight text-foreground`}>
                    {item.founder_name}
                  </p>
                  {item.city ? (
                    <p className="truncate text-[9px] uppercase tracking-[0.14em] text-foreground/45">
                      {item.city}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>


        {hasMore ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-full border border-white/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition hover:border-white/35 hover:text-foreground"
            >
              See all stories
            </button>
          </div>
        ) : null}
      </div>

      <FounderVideoLightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
}
