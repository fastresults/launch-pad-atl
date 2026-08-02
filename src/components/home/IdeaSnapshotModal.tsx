import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowDown, Loader2, MapPin, AlertTriangle, Check } from "lucide-react";
import { Link } from "react-router-dom";

type Signal = { label: string; value: string; note: string };

type Snapshot = {
  ok?: boolean;
  message?: string;
  idea_label?: string;
  verdict?: string;
  why_atlanta?: string[];
  signals?: Signal[];
  first_moves?: string[];
  watch_outs?: string[];
};

type Props = {
  idea: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Homepage hero companion: after a visitor types the startup they want to
 * start, this modal runs the `atlanta-viability` routine and shows a short,
 * grounded read on that startup in metro Atlanta — then invites them into the
 * next Foundation Workshop. The visitor never leaves the homepage.
 *
 * Layout is a fixed three-part frame: a pinned header, a single scroll region
 * (the ONLY scroller), and a sticky action bar so the workshop CTA is on
 * screen from first paint — including during loading and error states.
 */
export function IdeaSnapshotModal({ idea, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!open || !idea) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setSnapshot(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("atlanta-viability", {
          body: { idea },
        });
        if (cancelled) return;
        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);
        setSnapshot(data as Snapshot);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "We couldn't read the market just now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, idea]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hero-modal flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-[rgba(244,246,255,0.14)] p-0 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)] sm:max-h-[86vh]"
      >
        {/* Pinned header — context never scrolls away */}
        <div className="shrink-0 border-b border-[rgba(244,246,255,0.10)] px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] hero-faint">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Metro Atlanta read
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
          {loading && (
            <div>
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                Reading the Atlanta market for “{idea}”…
              </DialogTitle>
              <DialogDescription className="mt-2 hero-faint">
                One moment — pulling together the signals that matter here.
              </DialogDescription>
              <div className="mt-8 space-y-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded-full bg-[rgba(244,246,255,0.09)]"
                    style={{ width: `${92 - (i % 4) * 12}%` }}
                  />
                ))}
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm hero-faint">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Working
              </div>
            </div>
          )}

          {!loading && error && (
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

          {!loading && !error && snapshot && snapshot.ok === false && (
            <div>
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                Tell us a little more.
              </DialogTitle>
              <DialogDescription className="mt-2 hero-sub">
                {snapshot.message || "Describe the startup you'd like to start and we'll take another look."}
              </DialogDescription>
              <button type="button" onClick={close} className="hero-cta mt-6">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && snapshot?.ok !== false && snapshot?.verdict && (
            <>
              <DialogTitle
                className="text-2xl font-medium leading-tight sm:text-3xl"
                style={{ color: "var(--hero-fg)" }}
              >
                {snapshot.verdict}
              </DialogTitle>
              <DialogDescription className="sr-only">
                An Atlanta market read for {label}
              </DialogDescription>

              {/* Signals first — scannable proof before any prose */}
              {snapshot.signals?.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {snapshot.signals.map((signal, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[rgba(244,246,255,0.12)] bg-[rgba(244,246,255,0.04)] p-4"
                    >
                      <p className="text-[11px] uppercase tracking-[0.16em] hero-faint">{signal.label}</p>
                      <p className="mt-1.5 text-base font-medium" style={{ color: "var(--hero-fg)" }}>
                        {signal.value}
                      </p>
                      <p className="mt-1 text-sm hero-faint">{signal.note}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Quiet mid-scroll prompt so the offer lands twice */}
              <p className="mt-5 text-sm hero-faint">
                This is the part we build with you on August 20.
              </p>

              {snapshot.why_atlanta?.length ? (
                <div className="mt-8">
                  <h3 className="text-sm uppercase tracking-[0.16em] hero-faint">Why Atlanta</h3>
                  <div className="mt-3 space-y-4">
                    {snapshot.why_atlanta.map((para, i) => (
                      <p key={i} className="hero-sub text-[15px] leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {snapshot.first_moves?.length ? (
                <div className="mt-8">
                  <h3 className="text-sm uppercase tracking-[0.16em] hero-faint">What it takes to start</h3>
                  <ul className="mt-3 space-y-2.5">
                    {snapshot.first_moves.map((move, i) => (
                      <li key={i} className="flex gap-3 text-[15px] hero-sub">
                        <Check className="mt-1 h-4 w-4 shrink-0 hero-accent" aria-hidden="true" />
                        <span>{move}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {snapshot.watch_outs?.length ? (
                <div className="mt-8">
                  <h3 className="text-sm uppercase tracking-[0.16em] hero-faint">Watch-outs</h3>
                  <ul className="mt-3 space-y-2.5">
                    {snapshot.watch_outs.map((risk, i) => (
                      <li key={i} className="flex gap-3 text-[15px] hero-sub">
                        <AlertTriangle className="mt-1 h-4 w-4 shrink-0 hero-faint" aria-hidden="true" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* The full invitation, as the natural end of the read */}
              <div className="mt-9 rounded-3xl border border-[rgba(76,140,255,0.32)] bg-[rgba(76,140,255,0.08)] p-6">
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
                    "A live page for your startup, written and published with you",
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
                  Seats are capped so everyone gets built with, not talked at. $197.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <Link to={registerTo} onClick={close} className="hero-cta">
                    Reserve my seat
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={learnMore}
                    className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hero-faint"
                  >
                    Not ready? Learn more about the morning
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <Link
                    to="/contact"
                    onClick={close}
                    className="text-sm underline underline-offset-4 hero-faint"
                  >
                    Ask a question first
                  </Link>
                </div>

              </div>
            </>
          )}
        </div>

        {/* Sticky action bar — on screen from first paint */}
        <div className="shrink-0 border-t border-[rgba(244,246,255,0.12)] bg-[rgba(5,7,15,0.92)] px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm hero-sub">
              <span style={{ color: "var(--hero-fg)" }}>Thursday, Aug 20</span>
              <span className="hero-faint"> · IGNITE Center · $197</span>
            </p>
            <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={learnMore}
                className="inline-flex items-center justify-center gap-1.5 text-sm underline underline-offset-4 hero-faint"
              >
                Learn more
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <Link
                to={registerTo}
                onClick={close}
                className="hero-cta w-full justify-center sm:w-auto"
              >
                Reserve my seat
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
