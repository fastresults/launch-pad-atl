import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide } from "d3-force";
import type { SharePayload } from "@/lib/venture-share.functions";
import { cn } from "@/lib/utils";

type Node = {
  id: string;
  label: string;
  kind: "root" | "cluster" | "item";
  radius: number;
  color: string;
  itemKey?: string;
  /** per-node motion seed so nothing bobs in lockstep */
  phase: number;
  speed: number;
  amp: number;
};
type Link = { source: string; target: string; depth: 1 | 2; color: string };

const CLUSTER_COLORS = [
  "#e0b25c",
  "#7fb3d5",
  "#9fd6a0",
  "#d69fc8",
  "#e28f6d",
  "#9aa7e0",
  "#7fcfc4",
  "#d8c26a",
];

/** Stable pseudo-random in [0,1) from a string id. */
function seeded(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((c) => parseInt(c, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Public mind map of the venture. Built entirely from the share payload the
 * visitor already received, so it can never surface anything outside this
 * token's venture. The map is alive: orbs breathe and bob, connectors curve
 * and drift, and light pulses travel outward in the direction of the data.
 */
export function ShareMindMap({
  payload,
  onOpenItem,
}: {
  payload: SharePayload;
  onOpenItem: (key: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const clockRef = useRef(0);
  const [size, setSize] = useState({ w: 800, h: 520 });
  const [hover, setHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  hoverRef.current = hover;

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const compact = size.w < 640;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(360, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graph = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const rootColor = payload.venture.colors?.primary || "#e0b25c";
    nodes.push({
      id: "root",
      label: payload.venture.name,
      kind: "root",
      radius: 13,
      color: rootColor,
      phase: 0,
      speed: 0.35,
      amp: 0.05,
    });
    payload.sections.forEach((section, i) => {
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
      const s = seeded(section.key);
      nodes.push({
        id: section.key,
        label: section.label,
        kind: "cluster",
        radius: 8,
        color,
        phase: s * Math.PI * 2,
        speed: 0.4 + s * 0.25,
        amp: 0.06,
      });
      links.push({ source: "root", target: section.key, depth: 1, color });
      for (const item of section.items) {
        const t = seeded(item.key);
        nodes.push({
          id: item.key,
          label: item.title,
          kind: "item",
          radius: 4.5,
          color,
          itemKey: item.key,
          phase: t * Math.PI * 2,
          speed: 0.7 + t * 0.6,
          amp: 0.07,
        });
        links.push({ source: section.key, target: item.key, depth: 2, color });
      }
    });
    return { nodes, links };
  }, [payload]);

  // Neighbour lookup so hovering lights a whole branch.
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of graph.links) {
      if (!m.has(l.source)) m.set(l.source, new Set());
      if (!m.has(l.target)) m.set(l.target, new Set());
      m.get(l.source)!.add(l.target);
      m.get(l.target)!.add(l.source);
    }
    return m;
  }, [graph.links]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("collide", forceCollide((n: any) => n.radius + 10));
    fg.d3Force("charge")?.strength(-150);
    fg.d3Force("link")?.distance((l: any) => (l.depth === 1 ? 90 : 46));
    const t = setTimeout(() => fg.zoomToFit(600, 40), 700);
    return () => clearTimeout(t);
  }, [graph]);

  const linkId = (l: any) =>
    `${typeof l.source === "object" ? l.source.id : l.source}->${
      typeof l.target === "object" ? l.target.id : l.target
    }`;

  const touchesHover = (l: any) => {
    const h = hoverRef.current;
    if (!h) return false;
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    return s === h || t === h;
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-[min(68vh,640px)] w-full overflow-hidden rounded-2xl border border-border/60 bg-card/40"
    >
      <ForceGraph2D
        ref={fgRef}
        width={size.w}
        height={size.h}
        graphData={graph as any}
        cooldownTicks={120}
        d3AlphaDecay={0.0228}
        d3VelocityDecay={0.4}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={4}
        onNodeHover={(n: any) => setHover(n?.id ?? null)}
        onNodeClick={(n: any) => n?.itemKey && onOpenItem(n.itemKey)}
        /* Fluid connectors: a fixed gentle curve per link (cheap, stable). */
        linkCurvature={(l: any) => (reducedMotion ? 0 : 0.08 + seeded(linkId(l)) * 0.1)}

        linkColor={(l: any) => {
          const lit = touchesHover(l);
          const dim = hoverRef.current && !lit;
          if (lit) return withAlpha(l.color, 0.55);
          return `rgba(255,255,255,${dim ? 0.05 : 0.14})`;
        }}
        linkWidth={(l: any) => (touchesHover(l) ? 1.8 : 1)}
        /* Directional flow dots: root -> cluster -> asset */
        linkDirectionalParticles={(l: any) => {
          if (reducedMotion) return 0;
          if (l.depth === 1) return compact ? 1 : 2;
          return compact ? 0 : 1;
        }}
        linkDirectionalParticleSpeed={(l: any) =>
          (l.depth === 1 ? 0.006 : 0.0035) * (touchesHover(l) ? 2 : 1)
        }
        linkDirectionalParticleWidth={(l: any) => (touchesHover(l) ? 2.6 : 1.8)}
        linkDirectionalParticleColor={(l: any) => withAlpha(l.color, touchesHover(l) ? 0.95 : 0.6)}
        onRenderFramePre={() => {
          if (reducedMotion) return;
          clockRef.current += 1 / 60;
        }}

        nodeCanvasObject={(node: any, ctx, scale) => {
          const isHover = hover === node.id;
          const neighbours = hover ? adjacency.get(hover) : null;
          const isNear = neighbours ? neighbours.has(node.id) : false;
          const dim = hover && !isHover && !isNear;

          // Breathing radius + a small bob so each orb feels buoyant.
          const t = clockRef.current;
          const breathe = reducedMotion ? 1 : 1 + Math.sin(t * node.speed + node.phase) * node.amp;
          const bob = reducedMotion ? 0 : Math.sin(t * node.speed * 0.9 + node.phase) * 1.2;
          const r = node.radius * breathe * (isHover ? 1.3 : 1);
          const cx = node.x;
          const cy = node.y + bob;

          // Soft glow behind the anchor orbs.
          if (node.kind !== "item" || isHover) {
            const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6);
            glow.addColorStop(0, withAlpha(node.color, isHover ? 0.4 : 0.26));
            glow.addColorStop(1, withAlpha(node.color, 0));
            ctx.beginPath();
            ctx.arc(cx, cy, r * 2.6, 0, 2 * Math.PI);
            ctx.fillStyle = glow;
            ctx.globalAlpha = dim ? 0.25 : 1;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = dim ? 0.22 : node.kind === "item" && !isHover ? 0.88 : 1;
          ctx.fill();
          ctx.globalAlpha = 1;

          const showLabel = node.kind !== "item" || isHover || isNear || scale > 1.6;
          if (!showLabel) return;
          const fontSize = (node.kind === "root" ? 13 : node.kind === "cluster" ? 11 : 9) / scale;
          ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle =
            node.kind === "item"
              ? `rgba(255,255,255,${dim ? 0.25 : 0.72})`
              : `rgba(255,255,255,${dim ? 0.3 : 0.95})`;
          const label = node.label.length > 34 ? `${node.label.slice(0, 33)}…` : node.label;
          ctx.fillText(label, cx, cy + r + 2 / scale);
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5, 0, 2 * Math.PI);
          ctx.fill();
        }}
      />
      <p
        className={cn(
          "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-3 py-1",
          "text-[11px] text-muted-foreground backdrop-blur",
        )}
      >
        Drag to explore · click any node to open that asset
      </p>
    </div>
  );
}

export default ShareMindMap;
