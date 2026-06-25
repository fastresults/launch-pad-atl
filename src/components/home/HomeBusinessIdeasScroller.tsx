import { useMemo, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_IDEAS,
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
  return (
    <div className="group/idea relative w-[280px] shrink-0 rounded-xl border border-primary/15 bg-gradient-to-br from-card to-card/40 p-4 shadow-sm transition-colors hover:border-primary/40 sm:w-[320px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
          {CATEGORY_LABEL[idea.category]}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {idea.incomePotential}
        </span>
      </div>
      <h4 className="mb-1 text-sm font-semibold leading-snug text-foreground">{idea.name}</h4>
      <p className="line-clamp-2 text-xs text-muted-foreground">{idea.offer}</p>
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

export function HomeBusinessIdeasScroller() {
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
            What founders are building
          </div>
          <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
            60+ startup ideas founders are actually launching
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Across online, main street, service, food, side hustle, and family-run — proof there's a clear path no
            matter what you're starting.
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
                    ? "border-primary/60 bg-primary/15 text-foreground"
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
