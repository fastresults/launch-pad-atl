import { type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";

export type StepState = "locked" | "active" | "complete" | "incomplete";

export type StepStripItem = {
  n: number;
  label: string;
  state: StepState;
};

/**
 * Compact top strip showing the three wizard steps. Reached steps are real
 * buttons (click or arrow-key to move); locked steps are inert.
 */
export function StepStrip({
  steps,
  activeStep,
  onSelect,
}: {
  steps: StepStripItem[];
  activeStep: number;
  onSelect: (n: number) => void;
}) {
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const reachable = steps.filter((s) => s.state !== "locked").map((s) => s.n);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = reachable.indexOf(activeStep);
    if (idx === -1) return;
    const nextIdx = e.key === "ArrowRight" ? Math.min(idx + 1, reachable.length - 1) : Math.max(idx - 1, 0);
    const next = reachable[nextIdx];
    if (next === activeStep) return;
    onSelect(next);
    btnRefs.current[next]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Venture setup steps"
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-1.5"
    >
      {steps.map((s, i) => {
        const locked = s.state === "locked";
        const isActive = s.n === activeStep;
        const done = s.state === "complete";
        return (
          <div key={s.n} className="flex items-center gap-1.5">
            <button
              ref={(el) => {
                btnRefs.current[s.n] = el;
              }}
              type="button"
              disabled={locked}
              aria-current={isActive ? "step" : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !locked && onSelect(s.n)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
                isActive
                  ? "border-primary bg-primary/15 text-primary"
                  : locked
                    ? "cursor-not-allowed border-white/10 text-muted-foreground/50"
                    : done
                      ? "border-status-success/40 bg-status-success/10 text-status-success hover:bg-status-success/20"
                      : "border-white/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                  isActive ? "bg-primary/25" : done ? "bg-status-success/20" : "bg-white/10"
                }`}
              >
                {locked ? <Lock className="h-2.5 w-2.5" /> : done ? <Check className="h-2.5 w-2.5" /> : s.n}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className="h-px w-4 bg-white/15" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * One wizard step card. Renders its body only when active; collapsed when
 * already completed (click the header to reopen) and dimmed when still locked.
 */
export function StepShell({
  n,
  title,
  description,
  summary,
  state,
  headerRight,
  lockedHint,
  onOpen,
  children,
  footer,
  innerRef,
}: {
  n: number;
  title: string;
  description?: ReactNode;
  summary?: ReactNode;
  state: StepState;
  headerRight?: ReactNode;
  lockedHint?: string;
  onOpen: () => void;
  children: ReactNode;
  footer?: ReactNode;
  innerRef?: (el: HTMLElement | null) => void;
}) {
  const locked = state === "locked";
  const active = state === "active";
  const done = state === "complete";

  return (
    <section
      ref={innerRef}
      aria-labelledby={`step-${n}-title`}
      className={`scroll-mt-24 rounded-2xl border bg-card p-6 transition ${
        active ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]" : "border-white/10"
      } ${locked ? "opacity-55" : ""} ${active ? "space-y-4" : "space-y-2"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          disabled={locked || active}
          onClick={onOpen}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
              locked ? "text-muted-foreground" : done ? "text-status-success" : "text-primary"
            }`}
          >
            {locked ? <Lock className="h-3 w-3" /> : done ? <Check className="h-3.5 w-3.5" /> : null}
            Step {n}
          </div>
          <h2 id={`step-${n}-title`} className="mt-0.5 text-lg font-semibold">
            {title}
          </h2>
          {active && description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          {!active && locked ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{lockedHint ?? "Finish the step above first."}</p>
          ) : null}
          {!active && !locked ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{summary ?? "Tap to edit."}</p>
          ) : null}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {active ? headerRight : null}
          {!active && !locked ? (
            <Button type="button" size="sm" variant="ghost" onClick={onOpen} className="text-xs">
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      {active ? (
        <>
          {children}
          {footer}
        </>
      ) : null}
    </section>
  );
}

/** Back / Continue footer for an active step. */
export function StepNav({
  onBack,
  onNext,
  canGoNext,
  blockedReason,
  nextLabel = "Continue",
  nextSlot,
}: {
  onBack?: () => void;
  onNext?: () => void;
  canGoNext: boolean;
  blockedReason?: string;
  nextLabel?: string;
  nextSlot?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
      <div className="flex items-center gap-3">
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        {!canGoNext && blockedReason ? (
          <span className="text-xs text-muted-foreground">{blockedReason}</span>
        ) : null}
      </div>
      {nextSlot ?? (
        <Button type="button" size="sm" disabled={!canGoNext} onClick={onNext}>
          {nextLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
