import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChefHat,
  DollarSign,
  Home as HomeIcon,
  Laptop,
  Sparkles,
  Store,
  Sun,
  UserPlus,
  Wrench,
} from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_IDEAS,
  type BusinessCategory,
  type BusinessIdea,
} from "@/lib/business-ideas";
import { useEvent } from "@/lib/use-event";

const CATEGORY_ICON: Record<BusinessCategory, typeof Laptop> = {
  online: Laptop,
  "main-street": Store,
  service: Wrench,
  food: ChefHat,
  side: Sun,
  family: HomeIcon,
};

const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  online: "Online",
  "main-street": "Main Street",
  service: "Service",
  food: "Food & Hands",
  side: "Side hustle",
  family: "Family-run",
};

function IdeaCard({ idea }: { idea: BusinessIdea }) {
  const Icon = CATEGORY_ICON[idea.category];
  return (
    <article className="group relative flex w-[320px] shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_10px_40px_-15px_rgba(255,80,180,0.35)] md:w-[360px]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.15em]">
          <Icon className="size-3 text-foreground/70" />
          <span className="text-gradient-brand font-semibold">{CATEGORY_LABEL[idea.category]}</span>
        </span>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Monthly income potential
        </div>
        <div className="mt-0.5 text-2xl font-bold leading-tight tracking-tight">
          <span className="text-gradient-brand">{idea.incomePotential}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <DollarSign className="size-3" />
          {idea.startupCost}
        </div>
      </div>
      <h3 className="text-lg font-semibold leading-tight tracking-tight">{idea.name}</h3>
      <p className="text-sm text-foreground/80">{idea.offer}</p>
      <div className="mt-auto space-y-2 border-t border-white/5 pt-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <UserPlus className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
          <span>
            <span className="text-foreground/80">First 10 from:</span> {idea.firstCustomers}
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-foreground/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" />
          <span className="text-gradient-brand font-medium">{idea.stageHint}</span>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ ideas, direction }: { ideas: BusinessIdea[]; direction: "left" | "right" }) {
  if (ideas.length === 0) return null;
  const doubled = [...ideas, ...ideas];
  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div
        className={`marquee-track flex w-max gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
      >
        {doubled.map((idea, i) => (
          <IdeaCard key={`${idea.name}-${i}`} idea={idea} />
        ))}
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ArtOfThePossible() {
  const EVENT = useEvent();
  const [active, setActive] = useState<BusinessCategory | "all">("all");
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    setSeed((s) => s + 1);
  }, [active]);

  const filtered = useMemo(() => {
    const base = active === "all" ? BUSINESS_IDEAS : BUSINESS_IDEAS.filter((i) => i.category === active);
    return seed === 0 ? base : shuffle(base);
  }, [active, seed]);

  const rowA = filtered.filter((_, i) => i % 2 === 0);
  const rowB = filtered.filter((_, i) => i % 2 === 1);

  return (
    <section className="border-y border-white/5 py-12 md:py-20">
      <div className="mx-auto mb-8 max-w-6xl px-6 md:mb-10">
        <h2 className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          What others are starting in 2026
        </h2>
        <p className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:text-5xl">
          Proof, not a menu.{" "}
          <span className="text-gradient-brand">
            These are the kinds of businesses real people are launching in 2026 —
            online, on a street corner, out of a kitchen, off a phone, or built around AI.
          </span>
        </p>
        <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
          Scroll through for inspiration.{" "}
          <span className="font-medium text-foreground">
            Yours doesn't have to be on this list.
          </span>{" "}
          You walk in with your idea, and we build the business around it using the
          same seven stages — so you leave with a formed business and a 90-day plan
          you can run on Monday.
        </p>
        <p className="mt-3 max-w-2xl text-xs text-muted-foreground/80 md:text-sm">
          Income ranges are realistic year-one numbers for a solo operator who works
          the seven-stage plan. What you make will depend on your hours, your prices,
          and how many customers you keep.
        </p>
        <div className="mt-8 -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {BUSINESS_CATEGORIES.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${
                  isActive
                    ? "border-transparent bg-hero-gradient text-white shadow-[0_8px_24px_-12px_rgba(255,80,180,0.6)]"
                    : "border-white/15 bg-white/[0.02] text-foreground/80 hover:border-white/30 hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <MarqueeRow ideas={rowA} direction="left" />
        <div className="hidden md:block">
          <MarqueeRow ideas={rowB} direction="right" />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground/70 md:hidden">
        ← swipe or tap to pause →
      </p>

      <div className="mx-auto mt-12 max-w-6xl px-6">
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 md:p-8">
          <p className="text-lg md:text-xl">
            Whether your idea looks like one of these or nothing like them,{" "}
            <span className="text-gradient-brand font-semibold">it gets built the same way</span> —
            the same seven stages, in one day, in this room.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-hero-gradient px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Save your seat — only {EVENT.capacity} spots <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
