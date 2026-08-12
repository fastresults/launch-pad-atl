import { useMemo, useState, type ReactNode } from "react";
import { Info, Sparkles, TrendingUp } from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_IDEAS,
  toAnnualRange,
  type BusinessCategory,
  type BusinessIdea,
} from "@/lib/business-ideas";

type FilterId = BusinessCategory | "all";

const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  online: "Online",
  "main-street": "Main Street",
  service: "Service",
  food: "Food",
  side: "Side hustle",
  family: "Family-run",
};

function IdeaCard({ idea }: { idea: BusinessIdea }) {
  const [tapOpen, setTapOpen] = useState(false);
  const annual = toAnnualRange(idea.incomePotential);

  return (
    <div
      tabIndex={0}
      className="group/idea relative w-[300px] shrink-0 overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-card to-card/40 shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:border-primary/60 sm:w-[340px] sl-card-with-image"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={idea.image}
          alt={idea.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover/idea:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-card/40" />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary backdrop-blur">
          {CATEGORY_LABEL[idea.category]}
        </span>
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
          <TrendingUp className="h-3 w-3" />
          {idea.incomePotential}
        </span>

        {/* Mobile info toggle — hover doesn't exist on touch */}
        <button
          type="button"
          aria-label="Show AI insight"
          onClick={(e) => {
            e.stopPropagation();
            setTapOpen((v) => !v);
          }}
          className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-primary backdrop-blur transition-colors hover:bg-background sm:hidden"
        >
          <Info className="h-3.5 w-3.5" />
        </button>

        {/* AI insight overlay — hover on desktop, tap on mobile */}
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0 flex flex-col justify-between",
            "border-b border-primary/25 bg-gradient-to-b from-background/92 via-background/88 to-background/80 p-4 backdrop-blur-md",
            "opacity-0 translate-y-1 transition-all duration-200 ease-out",
            "group-hover/idea:opacity-100 group-hover/idea:translate-y-0",
            "group-focus-within/idea:opacity-100 group-focus-within/idea:translate-y-0",
            tapOpen ? "!opacity-100 !translate-y-0" : "",
          ].join(" ")}
        >
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {CATEGORY_LABEL[idea.category]}
            </span>
          </div>


          <div className="space-y-2.5 text-left">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                Ideal operator
              </div>
              <p className="mt-0.5 text-xs leading-snug text-foreground">{idea.idealOperator}</p>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                Why it's smart
              </div>
              <p className="mt-0.5 text-xs leading-snug text-foreground">{idea.whySmart}</p>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                Annual potential
              </div>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold leading-snug text-foreground">
                <TrendingUp className="h-3 w-3 text-primary" />
                {annual}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h4 className="mb-1 text-sm font-semibold leading-snug text-foreground">{idea.name}</h4>
        <p className="line-clamp-2 text-xs text-muted-foreground">{idea.offer}</p>
      </div>

      {/* Screen-reader accessible text (overlay is aria-hidden) */}
      <span className="sr-only">
        Ideal operator: {idea.idealOperator}. Why it's smart: {idea.whySmart}. Annual potential:{" "}
        {annual}.
      </span>
    </div>
  );
}

function MarqueeRow({
  ideas,
  direction = "left",
  duration = 60,
}: {
  ideas: BusinessIdea[];
  direction?: "left" | "right";
  duration?: number;
}) {
  if (ideas.length === 0) return null;
  const doubled = [...ideas, ...ideas];
  return (
    <div className="group/marquee relative overflow-hidden">
      <div
        className="flex w-max gap-4"
        style={{
          animation: `bi-scroll-${direction} ${duration}s linear infinite`,
          animationPlayState: "running",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {doubled.map((idea, i) => (
          <IdeaCard key={`${idea.name}-${i}`} idea={idea} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

export function HomeBusinessIdeasScroller({
  eyebrow = "What founders are building",
  heading = (
    <>
      60+ startup ideas founders are <span className="text-gradient-brand">actually launching</span>
    </>
  ),
  subheading = "Online and Main Street, side by side — plus service, food, side hustles and family-run. Proof there's a clear path no matter what you're starting.",
}: {
  eyebrow?: string;
  heading?: ReactNode;
  subheading?: string;
} = {}) {
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(
    () => (filter === "all" ? BUSINESS_IDEAS : BUSINESS_IDEAS.filter((i) => i.category === filter)),
    [filter],
  );

  const half = Math.ceil(filtered.length / 2);
  const rowA = filtered.slice(0, half);
  const rowB = filtered.slice(half).length > 0 ? filtered.slice(half) : filtered.slice(0, half);

  return (
    <section className="relative border-y border-border/40 bg-gradient-to-b from-background via-primary/[0.02] to-background py-20">
      <style>{`
        @keyframes bi-scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes bi-scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-to-r from-primary/20 to-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
            {heading}
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            {subheading}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {BUSINESS_CATEGORIES.map((cat) => {
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id as FilterId)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "border-primary/60 bg-secondary text-foreground"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                ].join(" ")}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <MarqueeRow ideas={rowA} direction="left" duration={Math.max(40, rowA.length * 4)} />
          <div className="hidden sm:block">
            <MarqueeRow ideas={rowB} direction="right" duration={Math.max(40, rowB.length * 4)} />
          </div>
        </div>
      </div>
    </section>
  );
}
