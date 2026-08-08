import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MindMapModel } from "@/lib/mind-map-model";
import { cn } from "@/lib/utils";

type MapNode = {
  id: string;
  label: string;
  kind: "root" | "cluster" | "item";
  x: number;
  y: number;
  radius: number;
  color: string;
  itemKey?: string;
  branch: string;
  phase: number;
  match: boolean;
  /** Outward direction of the node from its parent, used for label placement. */
  angle: number;
  /** Extra radial nudge so neighbouring labels in a fan do not collide. */
  labelLane: number;
};

type MapLink = {
  id: string;
  source: MapNode;
  target: MapNode;
  color: string;
  depth: 1 | 2;
  path: string;
};

type Camera = { x: number; y: number; k: number };

const VIEW_W = 1200;
const VIEW_H = 760;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 2.8;
const FALLBACK_COLORS = [
  "#e0b25c", "#7fb3d5", "#9fd6a0", "#d69fc8",
  "#e28f6d", "#9aa7e0", "#7fcfc4", "#d8c26a",
];

function seeded(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function safeColor(value: string | null | undefined, fallback: string) {
  return typeof value === "string" &&
    /^(#[\da-f]{3,8}|(?:rgb|hsl)a?\([^)]*\)|(?:oklch|oklab|lab|lch|color)\([^)]*\))$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function curve(source: MapNode, target: MapNode, bend: number) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const mx = (source.x + target.x) / 2 - (dy / length) * bend;
  const my = (source.y + target.y) / 2 + (dx / length) * bend;
  return `M ${source.x} ${source.y} Q ${mx} ${my} ${target.x} ${target.y}`;
}

function shortLabel(label: string, max = 28) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** A deterministic radial SVG mind map: no live force engine or unbounded render loop. */
export function RadialMindMap({
  model,
  onOpenItem,
  search = "",
  emptyMessage = "There is nothing to map yet.",
  hint = "Drag to explore · select an orb to open it",
  className,
  children,
}: {
  model: MindMapModel;
  onOpenItem?: (key: string) => void;
  search?: string;
  emptyMessage?: string;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{ distance: number; camera: Camera } | null>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, k: 1 });
  const instanceId = useId().replace(/:/g, "");
  const [camera, setCamera] = useState<Camera>(cameraRef.current);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const setSafeCamera = (next: Camera) => {
    const safe = {
      x: Number.isFinite(next.x) ? next.x : 0,
      y: Number.isFinite(next.y) ? next.y : 0,
      k: clamp(Number.isFinite(next.k) ? next.k : 1, MIN_ZOOM, MAX_ZOOM),
    };
    cameraRef.current = safe;
    setCamera(safe);
  };

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = surfaceRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      const current = cameraRef.current;
      const nextK = clamp(current.k * Math.exp(-dy * 0.0015), MIN_ZOOM, MAX_ZOOM);
      const px = ((event.clientX - rect.left) / rect.width) * VIEW_W;
      const py = ((event.clientY - rect.top) / rect.height) * VIEW_H;
      const ratio = nextK / current.k;
      setSafeCamera({
        k: nextK,
        x: px - (px - current.x) * ratio,
        y: py - (py - current.y) * ratio,
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const query = search.trim().toLowerCase();

  const graph = useMemo(() => {
    const nodes: MapNode[] = [];
    const links: MapLink[] = [];
    const usedIds = new Set<string>();
    const uniqueId = (candidate: string) => {
      const base = candidate.trim() || `node-${usedIds.size + 1}`;
      let value = base;
      let suffix = 2;
      while (usedIds.has(value)) value = `${base}-${suffix++}`;
      usedIds.add(value);
      return value;
    };
    const matches = (label: string) => (query ? label.toLowerCase().includes(query) : true);

    const root: MapNode = {
      id: uniqueId("mindmap-root"),
      label: String(model.center.label || "Venture"),
      kind: "root",
      x: VIEW_W / 2,
      y: VIEW_H / 2,
      radius: 28,
      color: safeColor(model.center.color, FALLBACK_COLORS[0]),
      branch: "mindmap-root",
      phase: 0,
      match: true,
      angle: -Math.PI / 2,
      labelLane: 0,
    };
    nodes.push(root);

    const branches = (model.branches ?? []).filter(Boolean).slice(0, 18);
    branches.forEach((section, sectionIndex) => {
      const angle = -Math.PI / 2 + (sectionIndex * Math.PI * 2) / Math.max(1, branches.length);
      const sectionColor = safeColor(section.color, FALLBACK_COLORS[sectionIndex % FALLBACK_COLORS.length]);
      const branch = uniqueId(String(section.key || `section-${sectionIndex + 1}`));
      const clusterDistance = branches.length > 10 ? 255 : 225;
      const cluster: MapNode = {
        id: branch,
        label: String(section.label || `Section ${sectionIndex + 1}`),
        kind: "cluster",
        x: root.x + Math.cos(angle) * clusterDistance,
        y: root.y + Math.sin(angle) * clusterDistance,
        radius: 18,
        color: sectionColor,
        branch,
        phase: seeded(branch) * 4,
        match: matches(String(section.label || "")),
        angle,
        labelLane: 0,
      };
      nodes.push(cluster);
      links.push({
        id: `${root.id}-${cluster.id}`,
        source: root,
        target: cluster,
        color: sectionColor,
        depth: 1,
        path: curve(root, cluster, (seeded(branch) - 0.5) * 28),
      });

      const items = (Array.isArray(section.items) ? section.items : []).filter(Boolean).slice(0, 40);
      items.forEach((item, itemIndex) => {
        const spread = Math.min(Math.PI * 0.9, Math.max(0.45, items.length * 0.12));
        const localAngle = angle + (items.length === 1 ? 0 : -spread / 2 + (itemIndex * spread) / (items.length - 1));
        const ring = 82 + (itemIndex % 3) * 30;
        const itemId = uniqueId(String(item.key || `${branch}-item-${itemIndex + 1}`));
        const itemNode: MapNode = {
          id: itemId,
          label: String(item.title || `Item ${itemIndex + 1}`),
          kind: "item",
          x: cluster.x + Math.cos(localAngle) * ring,
          y: cluster.y + Math.sin(localAngle) * ring,
          radius: 8,
          color: sectionColor,
          itemKey: item.key ? String(item.key) : undefined,
          branch,
          phase: seeded(itemId) * 4,
          match: matches(String(item.title || "")),
          angle: localAngle,
          labelLane: itemIndex % 3,
        };
        nodes.push(itemNode);
        links.push({
          id: `${cluster.id}-${itemNode.id}`,
          source: cluster,
          target: itemNode,
          color: sectionColor,
          depth: 2,
          path: curve(cluster, itemNode, (seeded(itemId) - 0.5) * 18),
        });
      });
    });
    return { nodes, links };
  }, [model, query]);

  const activeNode = activeId ? graph.nodes.find((node) => node.id === activeId) : null;
  const activeBranch = activeNode?.branch ?? null;

  const zoomAtCenter = (factor: number) => {
    const current = cameraRef.current;
    const nextK = clamp(current.k * factor, MIN_ZOOM, MAX_ZOOM);
    const ratio = nextK / current.k;
    setSafeCamera({
      k: nextK,
      x: VIEW_W / 2 - (VIEW_W / 2 - current.x) * ratio,
      y: VIEW_H / 2 - (VIEW_H / 2 - current.y) * ratio,
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      gestureRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), camera: cameraRef.current };
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointersRef.current.get(event.pointerId);
    if (!previous) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (pointersRef.current.size === 2 && gestureRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const start = gestureRef.current;
      const nextK = clamp(start.camera.k * (distance / Math.max(1, start.distance)), MIN_ZOOM, MAX_ZOOM);
      setSafeCamera({ ...start.camera, k: nextK });
      return;
    }
    const dx = ((event.clientX - previous.x) / rect.width) * VIEW_W;
    const dy = ((event.clientY - previous.y) / rect.height) * VIEW_H;
    const current = cameraRef.current;
    setSafeCamera({ ...current, x: current.x + dx, y: current.y + dy });
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    gestureRef.current = null;
  };

  if (graph.nodes.length === 1) {
    return (
      <div className={cn("flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-border/60 bg-card/40 p-6", className)}>
        <p className="max-w-xs text-center text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "relative h-full min-h-[360px] w-full touch-none select-none overflow-hidden rounded-2xl border border-border/60 bg-card/40",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      aria-label={`Interactive mind map for ${model.center.label}`}
    >
      <svg className="h-full w-full text-[color:var(--brain-ink)]" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="tree" aria-label="Mind map">
        <defs>
          {graph.nodes.filter((node) => node.kind !== "item").map((node) => (
            <filter key={node.id} id={`${instanceId}-glow-${node.id}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={node.kind === "root" ? 10 : 6} result="blur" />
              <feFlood floodColor={node.color} floodOpacity="0.45" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>
        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.k})`}>
          <g aria-hidden="true">
            {graph.links.map((link) => {
              const highlighted = !activeBranch || link.source.branch === activeBranch || link.target.branch === activeBranch;
              return (
                <g key={link.id} opacity={highlighted ? 1 : 0.12}>
                  <path
                    d={link.path}
                    fill="none"
                    stroke={link.depth === 1 ? link.color : "currentColor"}
                    strokeOpacity={link.depth === 1 ? 0.42 : 0.18}
                    strokeWidth={link.depth === 1 ? 2.2 : 1.2}
                    strokeDasharray={reducedMotion ? undefined : link.depth === 1 ? "8 9" : "4 8"}
                  >
                    {!reducedMotion && (
                      <animate attributeName="stroke-dashoffset" from="34" to="0" dur={link.depth === 1 ? "5s" : "7s"} repeatCount="indefinite" />
                    )}
                  </path>
                  {!reducedMotion && (link.depth === 1 || graph.nodes.length < 55) && (
                    <circle r={link.depth === 1 ? 3.2 : 2.2} fill={link.color}>
                      <animateMotion dur={`${4.5 + seeded(link.id) * 3}s`} repeatCount="indefinite" path={link.path} />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {[...graph.nodes]
            .sort((a, b) => Number(a.id === activeId) - Number(b.id === activeId))
            .map((node) => {
            const branchHighlighted = !activeBranch || node.branch === activeBranch || node.kind === "root";
            const isActive = activeId === node.id;
            const inActiveBranch = Boolean(activeBranch) && node.branch === activeBranch;
            const searchHit = Boolean(query) && node.match;
            // Item labels are always readable when their branch is in focus (hovered node,
            // hovered branch, search hit) and when zoomed in. Nothing else, so a resting
            // map stays clean but hovering never leaves the user guessing.
            const showLabel =
              node.kind !== "item" ||
              isActive ||
              searchHit ||
              inActiveBranch ||
              camera.k > 1.35;
            const canOpen = node.kind === "item" && Boolean(node.itemKey) && Boolean(onOpenItem);
            const opacity = !branchHighlighted ? 0.32 : query && !node.match && node.kind === "item" ? 0.4 : 1;
            const side = Math.cos(node.angle) >= 0 ? 1 : -1;
            const isRadial = node.kind === "item";
            const labelMax = node.kind === "item" ? (isActive ? 40 : 24) : 32;
            const text = shortLabel(node.label, labelMax);
            const fontSize = node.kind === "root" ? 18 : node.kind === "cluster" ? 14 : isActive ? 13.5 : 11.5;
            const chipped = isActive || (isRadial && inActiveBranch);
            const labelX = isRadial ? side * (node.radius + 9 + node.labelLane * 4) : 0;
            const labelY = isRadial ? Math.sin(node.angle) * 3 + node.labelLane * 1.5 : node.radius + 14;
            const chipW = text.length * fontSize * 0.56 + 14;
            return (
              <g
                key={node.id}
                role={canOpen ? "treeitem" : undefined}
                tabIndex={canOpen ? 0 : undefined}
                aria-label={canOpen ? `Open ${node.label}` : undefined}
                transform={`translate(${node.x} ${node.y})`}
                opacity={opacity}
                className={canOpen ? "cursor-pointer outline-none" : undefined}
                onMouseEnter={() => setActiveId(node.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(node.id)}
                onBlur={() => setActiveId(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  if (canOpen && node.itemKey) onOpenItem?.(node.itemKey);
                }}
                onKeyDown={(event) => {
                  if (canOpen && node.itemKey && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onOpenItem?.(node.itemKey);
                  }
                }}
              >
                <title>{node.label}</title>
                <g>
                  {!reducedMotion && (
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values={`0 0; 0 ${node.kind === "item" ? -3 : -5}; 0 0`}
                      dur={`${4.5 + node.phase}s`}
                      begin={`${node.phase * -1}s`}
                      repeatCount="indefinite"
                    />
                  )}
                  <circle
                    r={node.radius * (isActive ? 1.22 : 1)}
                    fill={node.color}
                    stroke={isActive ? "currentColor" : node.color}
                    strokeWidth={isActive ? 3 : 1}
                    filter={node.kind !== "item" ? `url(#${instanceId}-glow-${node.id})` : undefined}
                  >
                    {!reducedMotion && (
                      <animate
                        attributeName="r"
                        values={`${node.radius};${node.radius * 1.07};${node.radius}`}
                        dur={`${3.5 + node.phase}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                  {showLabel && (
                    <g pointerEvents="none">
                      {chipped && (
                        <rect
                          x={isRadial ? (side === 1 ? labelX - 7 : labelX - chipW + 7) : -chipW / 2}
                          y={labelY - (isRadial ? fontSize * 0.85 : fontSize * 0.9)}
                          width={chipW}
                          height={fontSize * 1.8}
                          rx={fontSize}
                          fill="var(--brain-halo)"
                          fillOpacity={isActive ? 0.96 : 0.85}
                          stroke={node.color}
                          strokeOpacity={isActive ? 0.7 : 0.35}
                        />
                      )}
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor={isRadial ? (side === 1 ? "start" : "end") : "middle"}
                        dominantBaseline={isRadial ? "middle" : undefined}
                        fill="var(--brain-ink)"
                        fontSize={fontSize}
                        fontWeight={node.kind === "item" ? (isActive ? 650 : 550) : 700}
                        paintOrder="stroke"
                        stroke={chipped ? "none" : "var(--brain-halo)"}
                        strokeWidth={chipped ? 0 : 5}
                        strokeOpacity={chipped ? 0 : 0.85}
                        strokeLinejoin="round"
                      >
                        {text}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute right-3 top-3 flex gap-1 rounded-md border border-border/60 bg-background/80 p-1 backdrop-blur">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomAtCenter(1.2)} aria-label="Zoom in">
          <Plus />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomAtCenter(1 / 1.2)} aria-label="Zoom out">
          <Minus />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSafeCamera({ x: 0, y: 0, k: 1 })} aria-label="Reset view">
          <RotateCcw />
        </Button>
      </div>
      {hint && (
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/75 px-3 py-1 text-center text-[11px] text-muted-foreground backdrop-blur">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

export default RadialMindMap;
