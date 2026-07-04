import { ChevronRight, CheckCircle2, Lock, Loader2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStageMeta } from "@/lib/stage-meta";

export type SectionHeaderProps = {
  cat: string;
  index: number; // 0-based
  done: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  status: "complete" | "in_progress" | "not_started" | "locked" | "generating";
  actions?: React.ReactNode;
  contentId: string;
};

const STATUS_META: Record<SectionHeaderProps["status"], { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  complete: { label: "Complete", className: "border-status-success/40 bg-status-success/10 text-status-success", Icon: CheckCircle2 },
  in_progress: { label: "In progress", className: "border-primary/40 bg-primary/10 text-primary", Icon: Circle },
  not_started: { label: "Not started", className: "border-white/10 bg-transparent text-muted-foreground", Icon: Circle },
  locked: { label: "Locked", className: "border-white/10 bg-transparent text-muted-foreground", Icon: Lock },
  generating: { label: "Writing…", className: "border-primary/40 bg-primary/10 text-primary", Icon: Loader2 },
};

export function SectionHeader({
  cat,
  index,
  done,
  total,
  isOpen,
  onToggle,
  status,
  actions,
  contentId,
}: SectionHeaderProps) {
  const meta = getStageMeta(cat);
  const Icon = meta.icon;
  const statusMeta = STATUS_META[status];
  const StatusIcon = statusMeta.Icon;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const accentStyle = { color: `hsl(var(${meta.accentVar}))` } as React.CSSProperties;
  const accentBarStyle = { backgroundColor: `hsl(var(${meta.accentVar}))` } as React.CSSProperties;
  const chipStyle = {
    backgroundColor: `hsl(var(${meta.accentVar}) / 0.18)`,
    color: `hsl(var(${meta.accentVar}))`,
    borderColor: `hsl(var(${meta.accentVar}) / 0.35)`,
  } as React.CSSProperties;
  const progressFillStyle = {
    width: `${pct}%`,
    backgroundColor: `hsl(var(${meta.accentVar}))`,
  } as React.CSSProperties;
  const containerStyle = {
    backgroundImage: `linear-gradient(90deg, hsl(var(${meta.accentVar}) / 0.10), hsl(var(${meta.accentVar}) / 0.03) 55%, hsl(var(--card) / 0.6))`,
    borderColor: `hsl(var(${meta.accentVar}) / 0.25)`,
  } as React.CSSProperties;

  return (
    <div className="group relative flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-3 pl-4 transition-shadow hover:shadow-md sm:gap-4 sm:p-4 sm:pl-5">
      {/* Accent left bar */}
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-[3px] rounded-full opacity-80 transition-all group-hover:w-1"
        style={accentBarStyle}
      />

      {/* Toggle button — everything except actions */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums"
          style={chipStyle}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <Icon className="hidden h-4 w-4 shrink-0 sm:block" style={accentStyle} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {getStageMeta(cat).label}
            </h3>
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              {done}/{total}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
            {getStageMeta(cat).tagline}
          </p>
        </div>
      </button>

      {/* Middle: progress + status */}
      <div className="flex items-center gap-3">
        <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/10 md:block" aria-hidden>
          <div className="h-full rounded-full transition-all" style={progressFillStyle} />
        </div>
        <Badge
          variant="outline"
          className={`gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusMeta.className}`}
        >
          <StatusIcon className={`h-3 w-3 ${status === "generating" ? "animate-spin" : ""}`} />
          {statusMeta.label}
        </Badge>
      </div>

      {/* Right: existing actions */}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
