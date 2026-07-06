import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { HUB_WELCOME_COPY } from "@/lib/hub-dashboard-copy";

/**
 * One-time, dismissible orientation banner shown at the top of the venture
 * workspace. Auto-hides once the founder has started generating (they don't
 * need onboarding anymore). Dismissal is per-venture so a brand new venture
 * still shows the strip.
 */
export function DashboardWelcomeStrip({
  snapshotId,
  hasProgress,
}: {
  snapshotId: string;
  hasProgress: boolean;
}) {
  const storageKey = `hub:welcome:${snapshotId}:dismissed`;
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (dismissed || hasProgress) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-3 pr-8">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{HUB_WELCOME_COPY.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{HUB_WELCOME_COPY.body}</p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss welcome message"
        onClick={() => {
          try {
            localStorage.setItem(storageKey, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
