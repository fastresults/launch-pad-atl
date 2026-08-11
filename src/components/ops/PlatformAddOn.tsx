import { useState } from "react";
import { ArrowRight, Boxes, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_COPY, PLATFORM_TYPES, type PlatformRequest } from "@/lib/ops-platform";
import { PlatformRequestDialog, type PlatformRequestInput } from "./PlatformRequestDialog";

/**
 * The add-on nobody should discover late: when the business *is* software, the
 * runway alone won't ship it. Sits under the two delivery choices as a quiet
 * third band — never a third option in the decision itself.
 */
export function PlatformAddOn({
  variant = "band", request, onRequest, className, mode,
}: {
  variant?: "band" | "strip";
  request?: PlatformRequest | null;
  onRequest?: (input: PlatformRequestInput) => Promise<void>;
  className?: string;
  /** Sharpen the line when the founder is going it alone. */
  mode?: "self" | "retained" | null;
}) {
  const [open, setOpen] = useState(false);
  const requested = !!request;

  const dialog = onRequest ? (
    <PlatformRequestDialog open={open} onOpenChange={setOpen} onSubmit={onRequest} />
  ) : null;

  if (variant === "strip") {
    return (
      <>
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/50 bg-card/30 px-3.5 py-2.5 text-xs",
            className,
          )}
        >
          <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          {requested ? (
            <span className="text-muted-foreground">{PLATFORM_COPY.requested}</span>
          ) : (
            <>
              <span className="font-medium">Building a platform, not just a site?</span>
              <span className="text-muted-foreground">
                Marketplaces, matching, booking and membership products — from $3,750, quoted on a build call.
              </span>
              <Button
                size="sm" variant="outline" className="ml-auto h-7 text-xs"
                disabled={!onRequest} onClick={() => setOpen(true)}
              >
                {PLATFORM_COPY.cta} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </>
          )}
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-5 sm:p-6",
          className,
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Boxes className="h-3.5 w-3.5" /> {PLATFORM_COPY.kicker}
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{PLATFORM_COPY.headline}</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {PLATFORM_COPY.body}{" "}
              {mode === "self"
                ? "It's the one thing on this page you can't self-serve from the list."
                : "Both paths above get the business running — add this when the product itself is software."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PLATFORM_TYPES.map((t) => (
                <span key={t} className="rounded-full border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Platform builds</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm text-muted-foreground">start at</span>
              <span className="text-3xl font-semibold tabular-nums">$3,750</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Scoped and quoted after a short build call — the number opens the conversation.
            </p>
            {requested ? (
              <p className="mt-4 flex items-start gap-2 text-xs text-primary">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {PLATFORM_COPY.requested}
              </p>
            ) : (
              <Button
                variant="outline" className="mt-4 w-full"
                disabled={!onRequest} onClick={() => setOpen(true)}
              >
                {PLATFORM_COPY.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {dialog}
    </>
  );
}

export default PlatformAddOn;
