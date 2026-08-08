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
};
type Link = { source: string; target: string };

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

/**
 * Public mind map of the venture. Built entirely from the share payload the
 * visitor already received, so it can never surface anything outside this
 * token's venture.
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
  const [size, setSize] = useState({ w: 800, h: 520 });
  const [hover, setHover] = useState<string | null>(null);

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
    nodes.push({
      id: "root",
      label: payload.venture.name,
      kind: "root",
      radius: 13,
      color: payload.venture.colors?.primary || "#e0b25c",
    });
    payload.sections.forEach((section, i) => {
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
      nodes.push({ id: section.key, label: section.label, kind: "cluster", radius: 8, color });
      links.push({ source: "root", target: section.key });
      for (const item of section.items) {
        nodes.push({
          id: item.key,
          label: item.title,
          kind: "item",
          radius: 4.5,
          color,
          itemKey: item.key,
        });
        links.push({ source: section.key, target: item.key });
      }
    });
    return { nodes, links };
  }, [payload]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("collide", forceCollide((n: any) => n.radius + 9));
    fg.d3Force("charge")?.strength(-140);
    const t = setTimeout(() => fg.zoomToFit(600, 40), 700);
    return () => clearTimeout(t);
  }, [graph]);

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
        cooldownTicks={90}
        backgroundColor="rgba(0,0,0,0)"
        linkColor={() => "rgba(255,255,255,0.14)"}
        linkWidth={1}
        nodeRelSize={4}
        onNodeHover={(n: any) => setHover(n?.id ?? null)}
        onNodeClick={(n: any) => n?.itemKey && onOpenItem(n.itemKey)}
        nodeCanvasObject={(node: any, ctx, scale) => {
          const isHover = hover === node.id;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = node.kind === "item" && !isHover ? 0.85 : 1;
          ctx.fill();
          ctx.globalAlpha = 1;

          const showLabel = node.kind !== "item" || isHover || scale > 1.6;
          if (!showLabel) return;
          const fontSize = (node.kind === "root" ? 13 : node.kind === "cluster" ? 11 : 9) / scale;
          ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = node.kind === "item" ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.95)";
          const label = node.label.length > 34 ? `${node.label.slice(0, 33)}…` : node.label;
          ctx.fillText(label, node.x, node.y + node.radius + 2 / scale);
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, 2 * Math.PI);
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
