import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide } from "d3-force";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { buildBrainGraph, BRAIN_CLUSTER_META, type BrainGraph, type BrainGraphNode } from "@/lib/brain-graph";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  snapshotId: string | null;
  company: string | null;
  onAskAbout: (label: string) => void;
};

/** Resolve a CSS var reference like "var(--brain-asset)" against the live DOM,
 *  so canvas fill styles get a real color. */
function resolveCssVar(ref: string): string {
  const m = /var\((--[a-z0-9-]+)\)/i.exec(ref);
  if (!m) return ref;
  const val = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return val || "#8888aa";
}

export default function BrainMindMap({ userId, snapshotId, company, onAskAbout }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BrainGraphNode | null>(null);
  const [search, setSearch] = useState("");
  const [hiddenClusters, setHiddenClusters] = useState<Set<string>>(new Set());

  // Pull the graph sources.
  const { data: memory = [] } = useQuery({
    queryKey: ["brain-graph", "memory", userId, snapshotId],
    queryFn: async () => {
      let q = supabase
        .from("founder_brain_memory")
        .select("id, kind, title, source_ref")
        .eq("user_id", userId)
        .limit(400);
      q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
      const { data } = await q;
      return data ?? [];
    },
    enabled: !!userId,
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["brain-graph", "notes", userId, snapshotId],
    queryFn: async () => {
      let q = supabase
        .from("founder_brain_notes")
        .select("id, content, source, created_at")
        .eq("user_id", userId)
        .limit(100);
      q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
      const { data } = await q;
      return data ?? [];
    },
    enabled: !!userId,
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["brain-graph", "docs", snapshotId],
    queryFn: async () => {
      if (!snapshotId) return [];
      const { data } = await supabase
        .from("venture_documents")
        .select("id, deliverable_type_key, title, hero_image_status, deep_assessment_status")
        .eq("snapshot_id", snapshotId)
        .limit(80);
      return data ?? [];
    },
    enabled: !!snapshotId,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ["brain-graph", "messages", userId, snapshotId],
    queryFn: async () => {
      let q = supabase
        .from("founder_brain_messages")
        .select("id, role, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40);
      q = snapshotId ? q.eq("snapshot_id", snapshotId) : q.is("snapshot_id", null);
      const { data } = await q;
      return (data ?? []).reverse();
    },
    enabled: !!userId,
  });

  const graph: BrainGraph = useMemo(
    () => buildBrainGraph({ company, memory: memory as any, notes: notes as any, docs: docs as any, messages: messages as any }),
    [company, memory, notes, docs, messages],
  );

  // Adjacency for hover-highlight.
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of graph.links) {
      const s = l.source as string;
      const t = l.target as string;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    }
    return map;
  }, [graph.links]);

  // Filter by visible clusters / search.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visible = graph.nodes.filter((n) => {
      if (n.kind === "root" || n.kind === "cluster") return !hiddenClusters.has(n.cluster) || n.kind === "root";
      return !hiddenClusters.has(n.cluster);
    });
    const visibleIds = new Set(visible.map((n) => n.id));
    const links = graph.links.filter((l) => visibleIds.has(l.source as string) && visibleIds.has(l.target as string));
    // add match flag
    const nodes = visible.map((n) => ({
      ...n,
      _match: q ? n.label.toLowerCase().includes(q) : true,
    }));
    return { nodes, links };
  }, [graph, hiddenClusters, search]);

  // Resize observer.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tune forces once graph is ready.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-90);
    fg.d3Force("link")?.distance((l: any) => (l.strength ? 30 : 55)).strength(0.6);
    fg.d3Force("collide", forceCollide((n: any) => (n.radius ?? 4) + 3));
  }, [filtered.nodes.length]);

  const reheat = () => {
    fgRef.current?.d3ReheatSimulation?.();
  };

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHover = hoverId === node.id;
    const neighbors = hoverId ? adjacency.get(hoverId) : null;
    const isNeighbor = neighbors ? neighbors.has(node.id) : false;
    const dim = hoverId && !isHover && !isNeighbor;
    const alpha = dim ? 0.15 : node._match === false ? 0.2 : 1;

    const r = (node.radius ?? 4) * (isHover ? 1.35 : 1);
    const color = resolveCssVar(node.color);

    ctx.globalAlpha = alpha;
    // Glow
    if (isHover || node.kind === "root" || node.kind === "cluster") {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + (isHover ? 6 : 3), 0, Math.PI * 2);
      ctx.fillStyle = color + "22";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Labels: cluster + root always; others on hover or zoom-in.
    const shouldLabel =
      node.kind === "root" ||
      node.kind === "cluster" ||
      isHover ||
      isNeighbor ||
      globalScale > 2.2 ||
      (node._match && !!search.trim());
    if (shouldLabel) {
      const fontSize = Math.max(9, 11 / Math.max(0.6, globalScale)) * (node.kind === "root" ? 1.4 : node.kind === "cluster" ? 1.15 : 1);
      ctx.font = `${node.kind === "root" || node.kind === "cluster" ? 600 : 500} ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(node.label, node.x, node.y + r + 3);
    }
    ctx.globalAlpha = 1;
  };

  const linkColor = () => resolveCssVar("var(--brain-edge)");

  const toggleCluster = (key: string) => {
    setHiddenClusters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Card className="relative overflow-hidden border-border/60 bg-[color:var(--brain-canvas)]">
      <div ref={wrapRef} className="relative h-[calc(100vh-14rem)] min-h-[520px] w-full">
        {size.w > 0 && (
          <ForceGraph2D
            ref={fgRef}
            graphData={filtered as any}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={4}
            nodeVal={(n: any) => (n.radius ?? 4) ** 2 / 4}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              ctx.beginPath();
              ctx.arc(node.x, node.y, (node.radius ?? 4) + 4, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkColor={linkColor}
            linkWidth={(l: any) => (hoverId && (l.source.id === hoverId || l.target.id === hoverId) ? 1.4 : 0.6)}
            linkDirectionalParticles={0}
            cooldownTicks={120}
            enableNodeDrag={true}
            onNodeHover={(n: any) => setHoverId(n?.id ?? null)}
            onNodeClick={(n: any) => {
              if (n.kind === "root" || n.kind === "cluster") {
                fgRef.current?.centerAt?.(n.x, n.y, 500);
                fgRef.current?.zoom?.(3, 500);
                return;
              }
              setSelected(n);
            }}
          />
        )}

        {/* Search */}
        <div className="pointer-events-auto absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-xs backdrop-blur">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-40 bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Reheat */}
        <Button
          size="sm"
          variant="outline"
          className="absolute right-3 top-3 h-8 gap-1.5 border-border/60 bg-background/70 backdrop-blur"
          onClick={reheat}
        >
          <RefreshCw className="h-3 w-3" /> Reheat
        </Button>

        {/* Legend */}
        <div className="pointer-events-auto absolute bottom-3 left-3 flex flex-wrap gap-1 rounded-lg border border-border/60 bg-background/70 p-2 backdrop-blur">
          {Object.entries(BRAIN_CLUSTER_META).map(([k, meta]) => {
            const hidden = hiddenClusters.has(k);
            return (
              <button
                key={k}
                onClick={() => toggleCluster(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2 py-0.5 text-[10px] transition-opacity",
                  hidden && "opacity-40",
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--brain-${k})` }} />
                {meta.label}
              </button>
            );
          })}
        </div>

        {filtered.nodes.length <= 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              No memory yet. Generate startup assets and click <b>Rebuild memory</b> to populate the mind map.
            </p>
          </div>
        )}
      </div>

      {/* Node drawer */}
      {selected && (
        <div className="absolute right-0 top-0 z-10 h-full w-[320px] border-l border-border/60 bg-card p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant="outline" className="text-[10px]">{selected.kind}</Badge>
              <h3 className="mt-1.5 text-sm font-semibold leading-snug">{selected.label}</h3>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onAskAbout(selected.label);
                setSelected(null);
              }}
            >
              Ask about this
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Sends "Tell me about {selected.label}" to the Second Brain chat.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
