import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyRecentRuns } from "@/lib/userPipeline.functions";
import { Sparkle, ChevronUp } from "lucide-react";

// Subtle bottom-right pill that shows the AI working in the background.
// Pings every few seconds during the workshop.
export function AIWorklogPill() {
  const recentFn = useServerFn(getMyRecentRuns);
  const { data } = useQuery({
    queryKey: ["my", "recent-runs"],
    queryFn: () => recentFn(),
    refetchInterval: 4000,
  });
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  const steps = data?.steps ?? [];
  const inFlight = steps.filter((s) => s.status === "running" || s.status === "pending");
  const recentlyDone = steps.filter((s) => s.status === "completed").slice(0, 3);

  // pulse when something new completes
  useEffect(() => {
    if (recentlyDone.length === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1500);
    return () => clearTimeout(t);
  }, [recentlyDone.length]);

  if (inFlight.length === 0 && recentlyDone.length === 0) return null;

  const headline = inFlight.length > 0
    ? `Working on ${inFlight.length} thing${inFlight.length > 1 ? "s" : ""}…`
    : "Just finished";

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {open && (
        <div className="mb-2 rounded-2xl border border-white/10 bg-card/95 backdrop-blur p-4 shadow-lg">
          {inFlight.length > 0 && (
            <>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Working on</div>
              <ul className="mt-1 space-y-1 text-sm">
                {inFlight.slice(0, 5).map((s, i) => (
                  <li key={`f-${i}`} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span className="truncate">{prettify(s.deliverable_key)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {recentlyDone.length > 0 && (
            <>
              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Just finished</div>
              <ul className="mt-1 space-y-1 text-sm">
                {recentlyDone.map((s, i) => (
                  <li key={`d-${i}`} className="flex items-center gap-2 text-muted-foreground">
                    <span>✅</span>
                    <span className="truncate">{prettify(s.deliverable_key)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border border-white/10 bg-card/95 backdrop-blur px-4 py-2.5 text-sm shadow-lg hover:bg-card transition ${pulse ? "ring-2 ring-primary/50" : ""}`}
      >
        <Sparkle className={`h-4 w-4 text-primary ${inFlight.length > 0 ? "animate-pulse" : ""}`} />
        <span>{headline}</span>
        <ChevronUp className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

function prettify(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
