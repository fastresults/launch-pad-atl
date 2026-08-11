import { cn } from "@/lib/utils";

/**
 * Wide line-art banners for the four stages of the operating runway, drawn in
 * the same language as the framework stage marks. Motion is a single draw-in
 * on mount — nothing loops while a founder is reading a list.
 */

type Props = { phase: number; className?: string };

function Art({ phase }: { phase: number }) {
  switch (phase) {
    // 1 — Prove people want it: a signal rising into real demand
    case 1:
      return (
        <>
          <path className="ops-rule" d="M12 62h296" />
          <g className="ops-dots">
            <circle cx="40" cy="52" r="2" /><circle cx="72" cy="46" r="2" />
            <circle cx="104" cy="49" r="2" /><circle cx="136" cy="40" r="2" />
            <circle cx="168" cy="34" r="2" /><circle cx="200" cy="30" r="2" />
          </g>
          <path className="ops-draw" d="M28 58C74 58 104 44 136 36s58-14 96-22" />
          <circle className="ops-seed" cx="28" cy="58" r="4.5" />
          <circle className="ops-spark" cx="232" cy="14" r="5" />
          <path className="ops-hair" d="M246 14h50" />
        </>
      );

    // 2 — Wire the business up: modules snapping into one machine
    case 2:
      return (
        <>
          <path className="ops-rule" d="M12 62h296" />
          <rect className="ops-mod" x="30" y="24" width="40" height="28" rx="5" />
          <rect className="ops-mod ops-d1" x="98" y="24" width="40" height="28" rx="5" />
          <rect className="ops-mod ops-d2" x="166" y="24" width="40" height="28" rx="5" />
          <path className="ops-draw ops-d1" d="M70 38h28M138 38h28" />
          <circle className="ops-ring ops-d3" cx="256" cy="38" r="20" />
          <circle className="ops-spark ops-d3" cx="256" cy="38" r="5" />
          <path className="ops-draw ops-d3" d="M206 38h30" />
        </>
      );

    // 3 — Make the first money: a proposal becoming a paid invoice
    case 3:
      return (
        <>
          <path className="ops-rule" d="M12 62h296" />
          <rect className="ops-mod" x="30" y="16" width="46" height="36" rx="4" />
          <path className="ops-hair" d="M40 28h26M40 36h20M40 44h24" />
          <path className="ops-draw ops-d1" d="M84 34h52" />
          <rect className="ops-mod ops-d1" x="144" y="16" width="46" height="36" rx="4" />
          <path className="ops-hair ops-d1" d="M154 28h26M154 36h20" />
          <path className="ops-tick ops-d2" d="M156 44l7 7 14-16" />
          <path className="ops-draw ops-d2" d="M198 34h32" />
          <circle className="ops-ring ops-d3" cx="252" cy="34" r="16" />
          <path className="ops-spark-line ops-d3" d="M252 24v20M246 30h12M246 38h12" />
        </>
      );

    // 4 — Build the habit: a repeating loop that compounds
    default:
      return (
        <>
          <path className="ops-rule" d="M12 62h296" />
          <path className="ops-draw" d="M40 46a26 26 0 1 1 26 22" />
          <path className="ops-tick ops-d1" d="M60 62l6 6 8-12" />
          <rect className="ops-bar ops-d1" x="132" y="44" width="16" height="18" rx="3" />
          <rect className="ops-bar ops-d2" x="164" y="34" width="16" height="28" rx="3" />
          <rect className="ops-bar ops-d3" x="196" y="24" width="16" height="38" rx="3" />
          <path className="ops-draw ops-d3" d="M232 50c14 0 18-10 26-18" />
          <circle className="ops-spark ops-d3" cx="266" cy="26" r="5" />
        </>
      );
  }
}

/** The wide banner used above a stage. Purely decorative. */
export function OpsStageArt({ phase, className }: Props) {
  return (
    <svg
      viewBox="0 0 320 76"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cn("opsart w-full text-foreground", className)}
    >
      <Art phase={phase} />
    </svg>
  );
}

/**
 * Wide decorative masthead: the stage banner held at a fixed aspect so it never
 * stretches, faded out toward the copy so type always wins.
 */
export function OpsStageMasthead({
  phase, className, side = "right",
}: { phase: number; className?: string; side?: "right" | "left" }) {
  const mask =
    side === "right"
      ? "linear-gradient(to left, black 30%, transparent)"
      : "linear-gradient(to right, black 30%, transparent)";
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 hidden items-center opacity-20 md:flex",
        side === "right" ? "right-0 justify-end" : "left-0 justify-start",
        className,
      )}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <OpsStageArt phase={phase} className="h-auto w-full" />
    </div>
  );
}

/** Shown when a stage — or the whole runway — has nothing left in it. */
export function OpsClearedMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={cn("opsart text-foreground", className)}>
      <circle className="ops-ring" cx="48" cy="48" r="34" />
      <circle className="ops-ring ops-d1" cx="48" cy="48" r="24" />
      <path className="ops-tick ops-d2" d="M36 49l9 9 18-21" />
    </svg>
  );
}

export default OpsStageArt;
