import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { buildBrainGraph, BRAIN_CLUSTER_META, type BrainGraph, type BrainGraphNode } from "@/lib/brain-graph";
import { brainGraphToMindMap } from "@/lib/mind-map-model";
import { RadialMindMap } from "@/components/brain/RadialMindMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  snapshotId: string | null;
  company: string | null;
  onAskAbout: (label: string) => void;
};

export default function BrainMindMap({ userId, snapshotId, company, onAskAbout }: Props) {
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
      const { data, error } = await q;
      if (error) console.warn("[BrainMindMap] memory query failed", error);
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
      const { data, error } = await q;
      if (error) console.warn("[BrainMindMap] notes query failed", error);
      return data ?? [];
    },
    enabled: !!userId,
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["brain-graph", "docs", snapshotId],
    queryFn: async () => {
      if (!snapshotId) return [];
      const { data, error } = await supabase
        .from("venture_documents")
        .select("id, document_type, status, hero_image_status, deep_assessment_status")
        .eq("snapshot_id", snapshotId)
        .limit(200);
      if (error) console.warn("[BrainMindMap] docs query failed", error);
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
      const { data, error } = await q;
      if (error) console.warn("[BrainMindMap] messages query failed", error);
      return (data ?? []).reverse();
    },
    enabled: !!userId,
  });

  const { data: snapshotSources = null } = useQuery({
    queryKey: ["brain-graph", "snapshot-sources", snapshotId],
    queryFn: async () => {
      if (!snapshotId) return null;
      const { data, error } = await supabase
        .from("venture_snapshots")
        .select("source_materials")
        .eq("id", snapshotId)
        .maybeSingle();
      if (error) console.warn("[BrainMindMap] snapshot sources query failed", error);
      return (data?.source_materials as any) ?? null;
    },
    enabled: !!snapshotId,
  });
  const { data: attendeeDocs = [] } = useQuery({
    queryKey: ["brain-graph", "attendee-docs", userId, snapshotId],
    queryFn: async () => {
      let q = supabase
        .from("attendee_documents")
        .select("id, original_name, kind, used_in_brief, snapshot_id")
        .eq("user_id", userId)
        .limit(100);
      if (snapshotId) q = q.eq("snapshot_id", snapshotId);
      const { data, error } = await q;
      if (error) console.warn("[BrainMindMap] attendee docs query failed", error);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const sources = useMemo(() => {
    const out: { id: string; filename: string; kind?: string | null; origin: "snapshot" | "upload" | "url" }[] = [];
    const seen = new Set<string>();
    const push = (row: { id: string; filename: string; kind?: string | null; origin: "snapshot" | "upload" | "url" }) => {
      const key = (row.filename || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(row);
    };
    const sm = snapshotSources as any;
    if (sm && Array.isArray(sm.documents)) {
      sm.documents.forEach((d: any, i: number) => {
        if (d?.filename) push({ id: `snap-doc-${i}`, filename: d.filename, kind: "document", origin: "snapshot" });
      });
    }
    if (sm && Array.isArray(sm.urls)) {
      sm.urls.forEach((u: any, i: number) => {
        const url = typeof u === "string" ? u : u?.url;
        if (url) push({ id: `snap-url-${i}`, filename: url, kind: "url", origin: "url" });
      });
    }
    for (const d of attendeeDocs as any[]) {
      if (d?.original_name) push({ id: d.id, filename: d.original_name, kind: d.kind, origin: "upload" });
    }
    return out;
  }, [snapshotSources, attendeeDocs]);

  const { data: docTypes = [] } = useQuery({
    queryKey: ["brain-graph", "doc-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venture_document_types")
        .select("type, name")
        .eq("active", true);
      if (error) console.warn("[BrainMindMap] doc types query failed", error);
      return data ?? [];
    },
  });

  const docTypeNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of docTypes as any[]) if (t?.type && t?.name) m[t.type] = t.name;
    return m;
  }, [docTypes]);

  const graph: BrainGraph = useMemo(
    () => buildBrainGraph({ company, memory: memory as any, notes: notes as any, docs: docs as any, messages: messages as any, docTypeNames, sources }),
    [company, memory, notes, docs, messages, docTypeNames, sources],
  );

  const nodesById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);

  // Hidden clusters filter the graph before it becomes a radial model.
  const visibleGraph = useMemo(() => {
    const nodes = graph.nodes.filter((n) => n.kind === "root" || !hiddenClusters.has(n.cluster));
    const ids = new Set(nodes.map((n) => n.id));
    const links = graph.links.filter((l) => ids.has(l.source as string) && ids.has(l.target as string));
    return { nodes, links: links.map((l) => ({ source: l.source as string, target: l.target as string })) };
  }, [graph, hiddenClusters]);

  const model = useMemo(() => brainGraphToMindMap(visibleGraph as any), [visibleGraph]);

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
      <div className="relative h-[calc(100vh-14rem)] min-h-[520px] w-full">
        <RadialMindMap
          model={model}
          search={search}
          className="h-full rounded-none border-0 bg-transparent"
          emptyMessage="Nothing to map yet. Generate startup assets, then Rebuild memory to enrich the graph."
          hint="Drag to explore · select an orb to ask about it"
          onOpenItem={(id) => {
            const node = nodesById.get(id);
            if (node) setSelected(node);
          }}
        />

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
