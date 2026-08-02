import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, MapPin, AlertTriangle, Check } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hero-cinematic max-h-[88vh] max-w-2xl overflow-y-auto rounded-3xl border-[rgba(244,246,255,0.14)] p-0 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)]">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] hero-faint">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Metro Atlanta read
          </div>

          {loading && (
            <div className="py-10">
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                Reading the Atlanta market for “{idea}”…
              </DialogTitle>
              <DialogDescription className="mt-2 hero-faint">
                One moment — pulling together the signals that matter here.
              </DialogDescription>
              <div className="mt-8 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded-full bg-[rgba(244,246,255,0.09)]"
                    style={{ width: `${92 - i * 12}%` }}
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
            <div className="py-8">
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                That didn't go through.
              </DialogTitle>
              <DialogDescription className="mt-2 hero-faint">{error}</DialogDescription>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="hero-cta mt-6"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && snapshot && snapshot.ok === false && (
            <div className="py-8">
              <DialogTitle className="text-xl font-medium" style={{ color: "var(--hero-fg)" }}>
                Tell us a little more.
              </DialogTitle>
              <DialogDescription className="mt-2 hero-faint">
                {snapshot.message || "Describe the startup you'd like to start and we'll take another look."}
              </DialogDescription>
              <button type="button" onClick={() => onOpenChange(false)} className="hero-cta mt-6">
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

              {snapshot.why_atlanta?.length ? (
                <div className="mt-5 space-y-4">
                  {snapshot.why_atlanta.map((para, i) => (
                    <p key={i} className="hero-sub text-[15px] leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              ) : null}

              {snapshot.signals?.length ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
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

              <div className="mt-9 rounded-3xl border border-[rgba(76,140,255,0.32)] bg-[rgba(76,140,255,0.08)] p-6">
                <p className="text-lg font-medium" style={{ color: "var(--hero-fg)" }}>
                  Build the first real pieces of {label} with us.
                </p>
                <p className="mt-2 text-[15px] hero-sub">
                  One focused morning at the IGNITE Center at Greater Atlanta Christian School —
                  Thursday, August 20, 2026. You leave with a live page, a priced offer, and your
                  first outreach sent. $197.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/register?idea=${encodeURIComponent(idea)}`}
                    onClick={() => onOpenChange(false)}
                    className="hero-cta"
                  >
                    Reserve my seat
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => onOpenChange(false)}
                    className="text-sm underline underline-offset-4 hero-faint"
                  >
                    Ask a question first
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
