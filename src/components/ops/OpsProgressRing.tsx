import { cn } from "@/lib/utils";

/**
 * Gradient progress arc for the runway header. The gold→blue brand gradient is
 * reserved for achievement, so completion visibly outweighs everything else.
 */
export function OpsProgressRing({
  pct, label, sub, className, size = 92,
}: {
  pct: number;
  label?: string;
  sub?: string;
  className?: string;
  size?: number;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ops-progress-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#d08c00" />
            <stop offset="1" stopColor="#628acf" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6"
          className="stroke-muted/40" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
          stroke="url(#ops-progress-grad)"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold tabular-nums leading-none">{clamped}%</span>
        {label && <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>}
        {sub && <span className="text-[10px] tabular-nums text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export default OpsProgressRing;
