import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Layout, LaidOutStep } from "@/lib/timeline-schedule";
import { dayToDate } from "@/lib/timeline-schedule";
import type { RevenueProjection } from "@/lib/timeline-revenue";
import { money } from "@/lib/timeline-revenue";
import type { TimelineScenario, VentureTimeline } from "@/lib/venture-timeline";

const RULER_H = 46;
const LANE_H = 74;
const BAR_H = 26;
const RIBBON_H = 96;
const PAD_L = 132;
const MIN_PX_PER_DAY = 0.6;
const MAX_PX_PER_DAY = 26;

const LANE_TINT: Record<string, string> = {
  founder: "hsl(38 92% 58%)",
  builder: "hsl(199 89% 60%)",
  marketer: "hsl(280 70% 68%)",
};

const MILESTONE_TINT: Record<string, string> = {
  cash: "hsl(142 70% 52%)",
  launch: "hsl(38 92% 58%)",
  proof: "hsl(199 89% 60%)",
  ops: "hsl(280 70% 68%)",
};

export interface CanvasProps {
  timeline: VentureTimeline;
  layout: Layout;
  /** Rendered behind the live layout so the cost of a change is visible. */
  ghost?: Layout | null;
  scenario: TimelineScenario;
  revenue?: RevenueProjection | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onNudge?: (id: string, days: number) => void;
  reducedMotion?: boolean;
}

/**
 * The timeline surface itself: an SVG that pans and zooms through time.
 * Deliberately hand-built — a Gantt library would drag project-management
 * chrome and its own styling into a view that has to feel like a story.
 */
export function TimelineCanvas({
  timeline,
  layout,
  ghost,
  scenario,
  revenue,
  selectedId,
  onSelect,
  onNudge,
  reducedMotion,
}: CanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [pxPerDay, setPxPerDay] = useState(4);
  const [originDay, setOriginDay] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  const lanes = layout.activeLanes;
  const showRibbon = !!revenue && revenue.points.length > 0;
  const baseHeight = RULER_H + lanes.length * LANE_H + (showRibbon ? RIBBON_H : 24) + 28;


  const totalDays = Math.max(
    layout.totalDays,
    ghost?.totalDays ?? 0,
    revenue?.freedomDay ?? 0,
    revenue?.breakevenDay ?? 0,
  ) + 14;

  const plotW = Math.max(120, width - PAD_L - 24);

  const fit = useCallback(() => {
    setPxPerDay(clampZoom(plotW / totalDays));
    setOriginDay(0);
  }, [plotW, totalDays]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    setWidth(el.getBoundingClientRect().width);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the whole plan on first paint and whenever its length changes a lot.
  const fittedFor = useRef(-1);
  useEffect(() => {
    const bucket = Math.round(totalDays / 30);
    if (fittedFor.current === bucket) return;
    fittedFor.current = bucket;
    fit();
  }, [totalDays, fit]);

  const x = useCallback((day: number) => PAD_L + (day - originDay) * pxPerDay, [originDay, pxPerDay]);
  const dayAtX = useCallback((px: number) => originDay + (px - PAD_L) / pxPerDay, [originDay, pxPerDay]);

  const clampOrigin = useCallback(
    (d: number) => Math.min(Math.max(d, -10), Math.max(0, totalDays - plotW / pxPerDay / 2)),
    [totalDays, plotW, pxPerDay],
  );

  // --- wheel zoom (native, non-passive) --------------------------------------
  const zoomRef = useRef({ pxPerDay, originDay, plotW, totalDays });
  zoomRef.current = { pxPerDay, originDay, plotW, totalDays };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const { pxPerDay: z, originDay: o } = zoomRef.current;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const dx = e.deltaX * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      // Trackpad two-finger scroll pans; ctrl/pinch and vertical wheel zoom.
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy)) {
        setOriginDay((d) => clampOrigin(d + dx / z));
        return;
      }
      const next = clampZoom(z * Math.exp(-dy * 0.0018));
      const anchorDay = o + (px - PAD_L) / z;
      setPxPerDay(next);
      setOriginDay(clampOrigin(anchorDay - (px - PAD_L) / next));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampOrigin]);

  // --- drag to pan ------------------------------------------------------------
  const drag = useRef<{ x: number; origin: number } | null>(null);
  const [panning, setPanning] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-step-bar]")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, origin: originDay };
    setPanning(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOriginDay(clampOrigin(drag.current.origin - (e.clientX - drag.current.x) / pxPerDay));
  };
  const endPan = () => {
    drag.current = null;
    setPanning(false);
  };

  // --- keyboard ---------------------------------------------------------------
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setOriginDay((d) => clampOrigin(d + 14));
    else if (e.key === "ArrowLeft") setOriginDay((d) => clampOrigin(d - 14));
    else if (e.key === "+" || e.key === "=") setPxPerDay((z) => clampZoom(z * 1.3));
    else if (e.key === "-") setPxPerDay((z) => clampZoom(z / 1.3));
    else if (e.key === "Home") fit();
    else return;
    e.preventDefault();
  };

  const ticks = useMemo(() => buildTicks(originDay, plotW / pxPerDay, pxPerDay), [originDay, plotW, pxPerDay]);

  // Milestone labels get their own band under the ruler, stacked into as many
  // rows as the current zoom needs, so they never overprint each other or the lanes.
  const milestonePlacement = useMemo(() => {
    const rowEnds: number[] = [];
    const placed = [...layout.milestones]
      .sort((a, b) => a.day - b.day)
      .map((m) => {
        const left = x(m.day) + 9;
        const w = m.milestone.label.length * 5.6 + 14;
        let row = rowEnds.findIndex((end) => left > end);
        if (row < 0) {
          row = rowEnds.length;
          rowEnds.push(0);
        }
        rowEnds[row] = left + w;
        return { m, row: Math.min(row, 2) };
      });
    return { placed, rows: Math.min(Math.max(rowEnds.length, 1), 3) };
  }, [layout.milestones, x]);

  const bandH = milestonePlacement.rows * 13 + 6;
  const height = baseHeight + bandH;

  const laneY = (i: number) => RULER_H + bandH + i * LANE_H;
  const ribbonY = RULER_H + bandH + lanes.length * LANE_H + 12;


  const phaseBands = useMemo(() => {
    const out: { id: string; label: string; from: number; to: number }[] = [];
    for (const phase of timeline.phases) {
      const bars = layout.steps.filter((s) => s.step.phase === phase.id);
      if (!bars.length) continue;
      out.push({
        id: phase.id,
        label: phase.label,
        from: Math.min(...bars.map((b) => b.startDay)),
        to: Math.max(...bars.map((b) => b.endDay)),
      });
    }
    return out.sort((a, b) => a.from - b.from);
  }, [timeline.phases, layout.steps]);

  const todayDay = useMemo(() => {
    const start = new Date(`${scenario.startDate}T00:00:00`).getTime();
    return (Date.now() - start) / 86_400_000;
  }, [scenario.startDate]);

  const ribbonPath = useMemo(() => {
    if (!showRibbon || !revenue?.peak) return null;
    const h = RIBBON_H - 34;
    const pts = revenue.points.map((p) => `${x(p.day).toFixed(1)},${(ribbonY + h - (p.monthly / revenue.peak) * h).toFixed(1)}`);
    if (!pts.length) return null;
    return {
      line: `M${pts.join("L")}`,
      area: `M${x(revenue.points[0].day).toFixed(1)},${ribbonY + h}L${pts.join("L")}L${x(
        revenue.points[revenue.points.length - 1].day,
      ).toFixed(1)},${ribbonY + h}Z`,
      h,
    };
  }, [showRibbon, revenue, x, ribbonY]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      role="application"
      aria-label="Venture launch timeline. Arrow keys pan, plus and minus zoom, Home resets."
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      className={cn(
        "relative touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c10] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/60",
        panning ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{ height }}
    >
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id="tl-ribbon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 70% 52%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(142 70% 52%)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="tl-plot">
            <rect x={PAD_L} y={0} width={Math.max(0, width - PAD_L)} height={height} />
          </clipPath>
        </defs>

        {/* phase bands */}
        <g clipPath="url(#tl-plot)">
          {phaseBands.map((p, i) => (
            <g key={p.id}>
              <rect
                x={x(p.from)}
                y={0}
                width={Math.max(1, (p.to - p.from) * pxPerDay)}
                height={height}
                fill={i % 2 ? "hsl(0 0% 100% / 0.028)" : "hsl(0 0% 100% / 0.055)"}
              />
              {/* A phase name that doesn't fit its band is worse than no name. */}
              {(p.to - p.from) * pxPerDay > p.label.length * 6.6 + 16 && (
                <text
                  x={x(p.from) + 8}
                  y={16}
                  className="fill-white/45"
                  style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  {p.label}
                </text>
              )}

            </g>
          ))}

          {/* ruler ticks */}
          {ticks.map((t) => (
            <g key={t.day}>
              <line x1={x(t.day)} y1={RULER_H - 12} x2={x(t.day)} y2={height - 8} stroke="hsl(0 0% 100% / 0.07)" />
              <text x={x(t.day) + 5} y={RULER_H - 16} className="fill-white/55" style={{ fontSize: 10 }}>
                {t.label}
              </text>
              <text x={x(t.day) + 5} y={RULER_H - 4} className="fill-white/30" style={{ fontSize: 9 }}>
                {dayToDate(scenario.startDate, t.day).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            </g>
          ))}

          {/* ghost (baseline) bars */}
          {ghost?.steps.map((g) => {
            const idx = lanes.findIndex((l) => l.id === g.lane);
            if (idx < 0) return null;
            return (
              <rect
                key={`ghost-${g.step.id}`}
                x={x(g.startDay)}
                y={laneY(idx) + (LANE_H - BAR_H) / 2 - 6}
                width={Math.max(2, (g.endDay - g.startDay) * pxPerDay)}
                height={4}
                rx={2}
                fill="hsl(0 0% 100% / 0.16)"
              />
            );
          })}

          {/* dependency curves */}
          {layout.steps.map((s) =>
            (s.step.dependsOn ?? []).map((depId) => {
              const dep = layout.byId.get(depId);
              if (!dep) return null;
              const yi = lanes.findIndex((l) => l.id === s.lane);
              const di = lanes.findIndex((l) => l.id === dep.lane);
              if (yi < 0 || di < 0) return null;
              const x1 = x(dep.endDay);
              const y1 = laneY(di) + LANE_H / 2;
              const x2 = x(s.startDay);
              const y2 = laneY(yi) + LANE_H / 2;
              const mid = (x1 + x2) / 2;
              return (
                <path
                  key={`${depId}->${s.step.id}`}
                  d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={
                    hover === s.step.id || selectedId === s.step.id
                      ? "hsl(0 0% 100% / 0.5)"
                      : "hsl(0 0% 100% / 0.12)"
                  }
                  strokeWidth={1}
                />
              );
            }),
          )}

          {/* bars */}
          {layout.steps.map((s) => (
            <StepBar
              key={s.step.id}
              s={s}
              laneIndex={lanes.findIndex((l) => l.id === s.lane)}
              x={x}
              pxPerDay={pxPerDay}
              y={laneY(lanes.findIndex((l) => l.id === s.lane))}
              active={selectedId === s.step.id}
              hovered={hover === s.step.id}
              reducedMotion={reducedMotion}
              onSelect={onSelect}
              onHover={setHover}
              onNudge={onNudge}
              dayAtX={dayAtX}
            />
          ))}

          {/* revenue ribbon */}
          {ribbonPath && revenue && (
            <g>
              <path d={ribbonPath.area} fill="url(#tl-ribbon)" />
              <path d={ribbonPath.line} fill="none" stroke="hsl(142 70% 55%)" strokeWidth={1.75} />
              {scenario.freedomLineMonthly && revenue.peak > 0 && (
                <g>
                  <line
                    x1={PAD_L}
                    x2={width}
                    y1={ribbonY + ribbonPath.h - Math.min(1, scenario.freedomLineMonthly / revenue.peak) * ribbonPath.h}
                    y2={ribbonY + ribbonPath.h - Math.min(1, scenario.freedomLineMonthly / revenue.peak) * ribbonPath.h}
                    stroke="hsl(38 92% 62%)"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_L + 8}
                    y={ribbonY + ribbonPath.h - Math.min(1, scenario.freedomLineMonthly / revenue.peak) * ribbonPath.h - 5}
                    className="fill-[hsl(38_92%_70%)]"
                    style={{ fontSize: 10 }}
                  >
                    Quit-my-job line · {money(scenario.freedomLineMonthly, revenue.currency)}/mo
                  </text>
                </g>
              )}
            </g>
          )}

          {/* milestones — labels stack into rows so they never overprint */}
          {milestonePlacement.placed.map(({ m, row }) => (
              <g key={m.milestone.id} transform={`translate(${x(m.day)},${RULER_H - 2})`}>

              <line
                y1={0}
                y2={bandH + lanes.length * LANE_H + 6}
                stroke={MILESTONE_TINT[m.milestone.kind]}
                strokeOpacity={0.32}
              />
              <rect
                x={-5}
                y={-5}
                width={10}
                height={10}
                transform="rotate(45)"
                fill={MILESTONE_TINT[m.milestone.kind]}
              />
              {/* Past three rows the header turns to noise — the diamond still marks the day. */}
              {row < 3 && (
                <text x={9} y={6 + row * 13} style={{ fontSize: 10.5 }} className="fill-white/80">
                  {m.milestone.label}
                </text>
              )}
            </g>
          ))}



          {/* today */}
          {todayDay > 0 && todayDay < totalDays && (
            <g>
              <line x1={x(todayDay)} x2={x(todayDay)} y1={RULER_H - 18} y2={height} stroke="hsl(0 0% 100% / 0.55)" strokeWidth={1} />
              <text x={x(todayDay) + 5} y={height - 12} className="fill-white/70" style={{ fontSize: 10 }}>
                today
              </text>
            </g>
          )}
        </g>

        {/* lane gutter */}
        <rect x={0} y={0} width={PAD_L} height={height} fill="#0b0c10" />
        {lanes.map((l, i) => (
          <g key={l.id}>
            <line x1={0} x2={width} y1={laneY(i)} y2={laneY(i)} stroke="hsl(0 0% 100% / 0.06)" />
            <circle cx={14} cy={laneY(i) + LANE_H / 2 - 6} r={4} fill={LANE_TINT[l.id]} />
            <text x={26} y={laneY(i) + LANE_H / 2 - 2} className="fill-white/90" style={{ fontSize: 12.5, fontWeight: 500 }}>
              {truncate(l.name, 16)}
            </text>
            <text x={26} y={laneY(i) + LANE_H / 2 + 13} className="fill-white/40" style={{ fontSize: 10 }}>
              {l.hoursPerWeek} hrs/week
            </text>
          </g>
        ))}
        {showRibbon && (
          <text x={14} y={ribbonY + 14} className="fill-white/45" style={{ fontSize: 10, letterSpacing: "0.14em" }}>
            REVENUE
          </text>
        )}
      </svg>

      <div className="pointer-events-none absolute right-3 top-3 flex gap-1">
        <ZoomBtn label="Zoom out" onClick={() => setPxPerDay((z) => clampZoom(z / 1.4))}>−</ZoomBtn>
        <ZoomBtn label="Zoom in" onClick={() => setPxPerDay((z) => clampZoom(z * 1.4))}>+</ZoomBtn>
        <ZoomBtn label="Fit the whole plan" onClick={fit}>Fit</ZoomBtn>
      </div>
    </div>
  );
}

function ZoomBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white/75 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
    >
      {children}
    </button>
  );
}

function StepBar({
  s,
  laneIndex,
  y,
  x,
  pxPerDay,
  active,
  hovered,
  reducedMotion,
  onSelect,
  onHover,
  onNudge,
  dayAtX,
}: {
  s: LaidOutStep;
  laneIndex: number;
  y: number;
  x: (d: number) => number;
  pxPerDay: number;
  active: boolean;
  hovered: boolean;
  reducedMotion?: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onNudge?: (id: string, days: number) => void;
  dayAtX: (px: number) => number;
}) {
  const dragRef = useRef<{ startX: number; moved: boolean } | null>(null);
  if (laneIndex < 0) return null;
  const tint = LANE_TINT[s.lane] ?? "hsl(199 89% 60%)";
  const bx = x(s.startDay);
  const w = Math.max(3, (s.workEndDay - s.startDay) * pxPerDay);
  const waitW = Math.max(0, (s.endDay - s.workEndDay) * pxPerDay);
  const top = y + (LANE_H - BAR_H) / 2;

  return (
    <g
      data-step-bar
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.currentTarget as any).setPointerCapture?.(e.pointerId);
        dragRef.current = { startX: e.clientX, moved: false };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current || !onNudge) return;
        const dx = e.clientX - dragRef.current.startX;
        if (Math.abs(dx) > 4) dragRef.current.moved = true;
      }}
      onPointerUp={(e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (d?.moved && onNudge) {
          const days = Math.round((e.clientX - d.startX) / pxPerDay);
          if (days !== 0) onNudge(s.step.id, days);
          return;
        }
        onSelect(s.step.id);
      }}
      onPointerEnter={() => onHover(s.step.id)}
      onPointerLeave={() => onHover(null)}
      style={{ cursor: onNudge ? "ew-resize" : "pointer" }}
    >
      {waitW > 0 && (
        <rect
          x={bx + w}
          y={top + BAR_H / 2 - 3}
          width={waitW}
          height={6}
          rx={3}
          fill={tint}
          fillOpacity={0.22}
        />
      )}
      <rect
        x={bx}
        y={top}
        width={w}
        height={BAR_H}
        rx={7}
        fill={tint}
        fillOpacity={active ? 0.95 : hovered ? 0.8 : 0.62}
        stroke={active ? "white" : "transparent"}
        strokeOpacity={0.85}
        style={reducedMotion ? undefined : { transition: "x 220ms ease, width 220ms ease, fill-opacity 150ms ease" }}
      />
      {s.accelerated && <circle cx={bx + 8} cy={top + BAR_H / 2} r={2.5} fill="#0b0c10" fillOpacity={0.6} />}
      {w > 54 && (
        <text
          x={bx + (s.accelerated ? 16 : 9)}
          y={top + BAR_H / 2 + 4}
          style={{ fontSize: 11, pointerEvents: "none" }}
          className="fill-[#0b0c10]"
        >
          {truncate(s.step.title, Math.max(4, Math.floor((w - 16) / 6.1)))}
        </text>
      )}
      {w <= 54 && (hovered || active) && (
        <text x={bx + w + 6} y={top + BAR_H / 2 + 4} style={{ fontSize: 11 }} className="fill-white/85">
          {truncate(s.step.title, 34)}
        </text>
      )}
    </g>
  );
}

function clampZoom(z: number) {
  return Math.min(MAX_PX_PER_DAY, Math.max(MIN_PX_PER_DAY, z));
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, Math.max(1, n - 1))}…` : s;
}

/** Tick spacing snaps between days / weeks / months so labels never crowd. */
function buildTicks(originDay: number, spanDays: number, pxPerDay: number) {
  const candidates = [1, 2, 7, 14, 30, 60, 90, 180];
  const step = candidates.find((c) => c * pxPerDay > 72) ?? 180;
  const first = Math.floor(originDay / step) * step;
  const out: { day: number; label: string }[] = [];
  for (let d = first; d <= originDay + spanDays + step; d += step) {
    if (d < 0) continue;
    out.push({ day: d, label: step >= 30 ? `Month ${Math.round(d / 30)}` : `Day ${Math.round(d)}` });
  }
  return out;
}
