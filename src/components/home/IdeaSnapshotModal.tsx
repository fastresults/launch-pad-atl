import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { parsePartialJson } from "@/lib/partial-json";
import {
  ArrowRight,
  ArrowDown,
  MapPin,
  AlertTriangle,
  Check,
  Users,
  TrendingUp,
  Wallet,
  CalendarClock,
  Globe,
  Map as MapIcon,
  Compass,
  Target,
  Hammer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FOUNDATION_SLUG, type CatalogWorkshop } from "@/lib/workshop-catalog";
import { WaitlistForm } from "@/components/home/workshop/WaitlistForm";

type Signal = { label: string; value: string; note: string };

type ReachTier = "local" | "regional" | "national" | "international";

type Reach = {
  tier?: ReachTier;
  headline?: string;
  why?: string;
  beyond_atlanta?: string;
  expansion_move?: string;
};

type Economics = {
  typical_ticket?: string;
  volume_per_week?: string;
  first_90_days?: string;
  steady_state?: string;
  startup_cost?: string;
  basis?: string;
};

type Snapshot = {
  ok?: boolean;
  message?: string;
  idea_label?: string;
  verdict?: string;
  reach?: Reach;
  economics?: Economics;
  signals?: Signal[];
  first_moves?: string[];
  watch_outs?: string[];
  why_atlanta?: string;
  /** Build-workshop diagnostic only. */
  gap?: { headline?: string; why?: string };
  costs?: string[];
  walk_out_with?: string[];
};


const REACH_LABEL: Record<ReachTier, string> = {
  local: "Local reach",
  regional: "Regional reach",
  national: "National reach",
  international: "International reach",
};

const REACH_ICON: Record<ReachTier, typeof Globe> = {
  local: MapPin,
  regional: MapIcon,
  national: Compass,
  international: Globe,
};

const REACH_TIERS: ReachTier[] = ["local", "regional", "national", "international"];

type Props = {
  idea: string;
  workshop: CatalogWorkshop;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};


/** Session cache so re-opening the same idea is instant. */
const cache = new Map<string, Snapshot>();

const SIGNAL_ICONS = [Users, TrendingUp, CalendarClock];

/**
 * Homepage hero companion: after a visitor types the startup they want to
 * start, this modal streams the `atlanta-viability` read — verdict, the money
 * picture, signals, first moves, watch-outs — and invites them into the next
 * Foundation Workshop. Content renders progressively as the model writes it,
 * inside a fixed three-part frame (pinned header, single scroller, sticky
 * action bar) so the CTA can never scroll off screen.
 */
export function IdeaSnapshotModal({ idea, workshop, open, onOpenChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || !idea) return;
    const key = `${workshop.slug}::${idea.trim().toLowerCase()}`;

    const cached = cache.get(key);
    if (cached) {
      setSnapshot(cached);
      setError(null);
      setStreaming(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    const run = async () => {
      setStreaming(true);
      setError(null);
      setSnapshot(null);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/atlanta-viability`;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anon,
            Authorization: `Bearer ${anon}`,
          },
          body: JSON.stringify({
            idea,
            workshopSlug: workshop.slug,
            lens: workshop.lens,
            artifacts: workshop.walkOuts,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || "We couldn't read the market just now.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const chunk = JSON.parse(data);
              const delta = chunk?.choices?.[0]?.delta?.content;
              if (typeof delta === "string") content += delta;
            } catch {
              /* partial SSE frame — ignore */
            }
          }

          const partial = parsePartialJson<Snapshot>(content);
          if (partial && !cancelled) setSnapshot(partial);
        }

        const final = parsePartialJson<Snapshot>(content);
        if (cancelled) return;
        if (!final) throw new Error("We couldn't read the market just now.");
        setSnapshot(final);
        if (final.ok !== false) cache.set(key, final);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "We couldn't read the market just now.");
      } finally {
        if (!cancelled) setStreaming(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, idea, workshop.slug, workshop.lens]);

  const label = snapshot?.idea_label || idea;
  const registerTo = `/register?idea=${encodeURIComponent(idea)}`;
  const close = () => onOpenChange(false);

  /** Close the modal and land the visitor on the section right below the hero. */
  const learnMore = () => {
    onOpenChange(false);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById("learn-more")?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      }, 120);
    });
  };

  const isFoundation = workshop.slug === FOUNDATION_SLUG;
  const econ = snapshot?.economics;
  const reach = snapshot?.reach;
  const tier: ReachTier | null =
    reach?.tier && REACH_TIERS.includes(reach.tier) ? reach.tier : null;
  const isLocal = tier === "local";
  const HeaderIcon = isFoundation ? (tier ? REACH_ICON[tier] : MapPin) : Target;
  const headerLabel = !isFoundation
    ? `${workshop.chipLabel} read`
    : tier && !isLocal
      ? `Atlanta start · ${tier} reach`
      : "Metro Atlanta read";
  const invalid = snapshot?.ok === false;
  const showRead = !error && !invalid;
  const walkOuts =
    snapshot?.walk_out_with?.length ? snapshot.walk_out_with : workshop.walkOuts.slice(0, 3);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hero-modal hero-modal-frame flex w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-[rgba(244,246,255,0.14)] p-0 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)]">
        {/* Pinned header — context never scrolls away */}
        <div className="shrink-0 border-b border-[rgba(244,246,255,0.10)] px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] hero-faint">
            <HeaderIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {headerLabel}
            {streaming && <span className="hero-dot ml-1" aria-hidden="true" />}
          </div>
          <p
            className="mt-1 truncate pr-8 text-[15px] font-medium"
            style={{ color: "var(--hero-fg)" }}
          >
            {label}
          </p>
        </div>

        {/* The only scroll region */}
        <div className="hero-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
          {error && (
            <div>
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                That didn't go through.
              </DialogTitle>
              <DialogDescription className="mt-2 hero-sub">{error}</DialogDescription>
              <p className="mt-4 text-[15px] hero-sub">
                It doesn't change the invitation below — bring the idea to the room on August 20 and
                we'll build the first real pieces of it with you.
              </p>
            </div>
          )}

          {!error && invalid && (
            <div>
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                Tell us a little more.
              </DialogTitle>
              <DialogDescription className="mt-2 hero-sub">
                {snapshot?.message ||
                  "Describe the startup you'd like to start and we'll take another look."}
              </DialogDescription>
              <button type="button" onClick={close} className="hero-cta mt-6">
                Try again
              </button>
            </div>
          )}

          {showRead && (
            <>
              {snapshot?.verdict ? (
                <DialogTitle
                  className="text-2xl font-medium leading-tight sm:text-3xl"
                  style={{ color: "var(--hero-fg)" }}
                >
                  {snapshot.verdict}
                </DialogTitle>
              ) : (
                <>
                  <DialogTitle className="sr-only">Reading the Atlanta market for {idea}</DialogTitle>
                  <div className="space-y-2.5">
                    <div className="hero-skel h-7 w-[86%]" />
                    <div className="hero-skel h-7 w-[54%]" />
                  </div>
                </>
              )}
              <DialogDescription className="sr-only">
                An Atlanta market read for {label}
              </DialogDescription>

              {isFoundation ? (
                <>
              {/* How far this can travel — Atlanta is the start, not the ceiling */}
              <div className="mt-5 rounded-2xl border border-[rgba(244,246,255,0.12)] bg-[rgba(244,246,255,0.04)] p-4">
                {tier ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(76,140,255,0.35)] bg-[rgba(76,140,255,0.12)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] hero-accent">
                        <HeaderIcon className="h-3 w-3" aria-hidden="true" />
                        {REACH_LABEL[tier]}
                      </span>
                      {reach?.headline ? (
                        <span className="text-[15px] font-medium" style={{ color: "var(--hero-fg)" }}>
                          {reach.headline}
                        </span>
                      ) : null}
                    </div>
                    {reach?.why ? <p className="mt-2.5 text-sm hero-sub">{reach.why}</p> : null}
                    {reach?.beyond_atlanta ? (
                      <p className="mt-1.5 text-sm hero-sub">{reach.beyond_atlanta}</p>
                    ) : null}
                    {!isLocal && reach?.expansion_move ? (
                      <p className="mt-2.5 text-sm hero-faint">
                        <span className="uppercase tracking-[0.14em] text-[10px]">
                          First move that opens it up ·{" "}
                        </span>
                        {reach.expansion_move}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="hero-skel h-5 w-[46%]" />
                    <div className="hero-skel h-4 w-[82%]" />
                  </div>
                )}
              </div>

              {/* The money picture — skeletoned from paint one */}
              <div className="mt-5 rounded-3xl border border-[rgba(76,140,255,0.28)] bg-[rgba(76,140,255,0.07)] p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] hero-faint">
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                  {isLocal || !tier
                    ? "What this can earn around Atlanta"
                    : "What this can earn as it reaches further"}
                </div>


                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MoneyTile caption="Typical ticket" value={econ?.typical_ticket} />
                  <MoneyTile caption="Clients / week" value={econ?.volume_per_week} />
                  <MoneyTile caption="Cost to start" value={econ?.startup_cost} />
                </div>

                <div className="mt-4 space-y-3">
                  <RangeBar caption="By month 3" value={econ?.first_90_days} width="38%" />
                  <RangeBar caption="Around month 12" value={econ?.steady_state} width="88%" />
                </div>

                {econ?.basis ? <p className="mt-4 text-sm hero-sub">{econ.basis}</p> : null}
                <p className="mt-2 text-xs hero-faint">
                  Illustrative ranges for what similar startups charge around metro Atlanta — not a
                  projection, promise, or guarantee.
                </p>
              </div>

                </>
              ) : (
                <>
              {/* Build-track diagnostic — the gap, what it costs, what the morning hands back */}
              <div className="mt-5 rounded-2xl border border-[rgba(244,246,255,0.12)] bg-[rgba(244,246,255,0.04)] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] hero-faint">
                  <Target className="h-3.5 w-3.5" aria-hidden="true" />
                  The gap
                </div>
                {snapshot?.gap?.headline ? (
                  <>
                    <p className="mt-2 text-[17px] font-medium leading-snug" style={{ color: "var(--hero-fg)" }}>
                      {snapshot.gap.headline}
                    </p>
                    {snapshot.gap.why ? <p className="mt-2 text-sm hero-sub">{snapshot.gap.why}</p> : null}
                  </>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="hero-skel h-5 w-[62%]" />
                    <div className="hero-skel h-4 w-[86%]" />
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-3xl border border-[rgba(244,246,255,0.10)] bg-[rgba(244,246,255,0.03)] p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] hero-faint">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  What it costs to leave it
                </div>
                {snapshot?.costs?.length ? (
                  <ul className="mt-3 space-y-2.5">
                    {snapshot.costs.slice(0, 3).map((cost, i) => (
                      <li key={i} className="text-[15px] hero-sub">
                        {cost}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="hero-skel h-4 w-[90%]" />
                    <div className="hero-skel h-4 w-[76%]" />
                    <div className="hero-skel h-4 w-[82%]" />
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-3xl border border-[rgba(76,140,255,0.28)] bg-[rgba(76,140,255,0.07)] p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] hero-faint">
                  <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                  What you walk out with
                </div>
                <ul className="mt-3 space-y-2.5">
                  {walkOuts.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] hero-sub">
                      <Check className="mt-1 h-4 w-4 shrink-0 hero-accent" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs hero-faint">
                  Built with you in one morning — decisions made and real first versions in your
                  hands, not a finished agency deliverable.
                </p>

              </div>

                </>
              )}

              {isFoundation && snapshot?.signals?.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {snapshot.signals.slice(0, 3).map((signal, i) => {
                    const Icon = SIGNAL_ICONS[i % SIGNAL_ICONS.length];
                    return (
                      <div
                        key={i}
                        className="rounded-2xl border border-[rgba(244,246,255,0.12)] bg-[rgba(244,246,255,0.04)] p-4"
                      >
                        <Icon className="h-4 w-4 hero-accent" aria-hidden="true" />
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] hero-faint">
                          {signal.label}
                        </p>
                        <p className="mt-1 text-[15px] font-medium" style={{ color: "var(--hero-fg)" }}>
                          {signal.value}
                        </p>
                        <p className="mt-1 text-sm hero-faint">{signal.note}</p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {isFoundation && snapshot?.first_moves?.length ? (
                <div className="mt-8">
                  <h3 className="text-sm uppercase tracking-[0.16em] hero-faint">
                    What it takes to start
                  </h3>
                  <ol className="mt-3 space-y-2.5">
                    {snapshot.first_moves.map((move, i) => (
                      <li key={i} className="flex gap-3 text-[15px] hero-sub">
                        <span className="hero-step" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span>{move}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {snapshot?.watch_outs?.length ? (
                <div className="mt-6 rounded-2xl border border-[rgba(244,246,255,0.10)] bg-[rgba(244,246,255,0.03)] p-4">
                  <h3 className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] hero-faint">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    Watch-outs
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {snapshot.watch_outs.map((risk, i) => (
                      <li key={i} className="text-[15px] hero-sub">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {snapshot?.why_atlanta ? (
                <p className="mt-6 text-[15px] leading-relaxed hero-sub">{snapshot.why_atlanta}</p>
              ) : null}

              {/* The full invitation, as the natural end of the read */}
              {isFoundation ? (
                <div className="mt-8 rounded-3xl border border-[rgba(76,140,255,0.32)] bg-[rgba(76,140,255,0.08)] p-6">
                  <p className="text-lg font-medium" style={{ color: "var(--hero-fg)" }}>
                    Don't start it alone. Build the first real pieces of {label} with us.
                  </p>
                  <p className="mt-2 text-[15px] hero-sub">
                    One focused morning at the IGNITE Center at Greater Atlanta Christian School —
                    Thursday, August 20, 2026. You don't leave with notes. You leave with a live page
                    people can visit, a priced offer, and your first outreach already sent.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      "A live page for your startup, written and published with you where account access allows",
                      "A priced offer you can say out loud without flinching",
                      "Your first real outreach sent before you go home",
                    ].map((item) => (
                      <li key={item} className="flex gap-3 text-[15px] hero-sub">
                        <Check className="mt-1 h-4 w-4 shrink-0 hero-accent" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm hero-faint">
                    Seats are capped so everyone gets built with, not talked at. $197. It's one
                    morning — first real versions, not a finished agency deliverable.
                  </p>

                  <div className="mt-5">
                    <ActionRow registerTo={registerTo} onLearnMore={learnMore} onClose={close} />
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-[rgba(76,140,255,0.32)] bg-[rgba(76,140,255,0.08)] p-6">
                  <p className="text-lg font-medium" style={{ color: "var(--hero-fg)" }}>
                    We build this with you in one morning — {workshop.title} opens{" "}
                    {workshop.opensLabel}.
                  </p>
                  <p className="mt-2 text-[15px] hero-sub">
                    Put your email down and you get first access when seats open at the IGNITE Center
                    at Greater Atlanta Christian School. {workshop.priceLabel}, capped room, built
                    with you — not talked at.
                  </p>
                  <div className="mt-4">
                    <WaitlistForm
                      slug={workshop.slug}
                      label="Get first access"
                      doneMessage={`You're first in line for ${workshop.chipLabel}.`}
                    />
                  </div>
                  <p className="mt-5 text-sm hero-sub">
                    Don't want to wait? The Foundation Workshop is open now — Thursday, August 20,
                    2026 — and it's where most founders start.
                  </p>
                  <div className="mt-4">
                    <ActionRow
                      registerTo={registerTo}
                      onLearnMore={learnMore}
                      onClose={close}
                      reserveLabel="Reserve a Foundation seat"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky action bar — on screen from first paint */}
        <div className="shrink-0 border-t border-[rgba(244,246,255,0.12)] bg-[rgba(5,7,15,0.92)] px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm hero-sub">
              {isFoundation ? (
                <>
                  <span style={{ color: "var(--hero-fg)" }}>Thursday, Aug 20</span>
                  <span className="hero-faint"> · IGNITE Center · $197</span>
                </>
              ) : (
                <>
                  <span style={{ color: "var(--hero-fg)" }}>{workshop.chipLabel}</span>
                  <span className="hero-faint">
                    {" "}
                    · opens {workshop.opensLabel} · {workshop.priceLabel}
                  </span>
                </>
              )}
            </p>
            <ActionRow
              compact
              registerTo={registerTo}
              onLearnMore={learnMore}
              onClose={close}
              reserveLabel={isFoundation ? "Reserve my seat" : "Reserve a Foundation seat"}
            />
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}

/**
 * The one action set for this modal, ranked: learn more (primary),
 * reserve (secondary), ask (tertiary). Same order everywhere it appears.
 */
function ActionRow({
  registerTo,
  onLearnMore,
  onClose,
  compact = false,
  reserveLabel = "Reserve my seat",
}: {
  registerTo: string;
  onLearnMore: () => void;
  onClose: () => void;
  compact?: boolean;
  reserveLabel?: string;
}) {
  const size = compact ? "px-4 py-2 text-sm" : "";
  return (
    <div
      className={`flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center ${
        compact ? "sm:gap-2" : "sm:gap-3"
      }`}
    >
      <button
        type="button"
        onClick={onLearnMore}
        className={`hero-btn hero-btn-primary ${size}`}
      >
        Learn more about the morning
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
      </button>
      <Link to={registerTo} onClick={onClose} className={`hero-btn hero-btn-secondary ${size}`}>
        {reserveLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link to="/contact" onClick={onClose} className={`hero-btn hero-btn-ghost ${size}`}>
        Ask a question
      </Link>
    </div>
  );
}


function MoneyTile({ caption, value }: { caption: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(244,246,255,0.10)] bg-[rgba(5,7,15,0.45)] p-3.5">
      <p className="text-[10px] uppercase tracking-[0.16em] hero-faint">{caption}</p>
      {value ? (
        <p
          className="mt-1.5 text-[17px] font-medium leading-snug"
          style={{ color: "var(--hero-fg)" }}
        >
          {value}
        </p>
      ) : (
        <div className="hero-skel mt-2 h-5 w-4/5" />
      )}
    </div>
  );
}

function RangeBar({
  caption,
  value,
  width,
}: {
  caption: string;
  value?: string;
  width: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.14em] hero-faint">{caption}</span>
        {value ? (
          <span className="text-[15px] font-medium" style={{ color: "var(--hero-fg)" }}>
            {value}
          </span>
        ) : (
          <span className="hero-skel inline-block h-4 w-24" />
        )}
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(244,246,255,0.08)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(76,140,255,0.45),#4C8CFF)] transition-[width] duration-700"
          style={{ width: value ? width : "0%" }}
        />
      </div>
    </div>
  );
}
