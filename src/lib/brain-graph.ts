// Pure helpers to shape Second Brain data into a force-graph-compatible
// { nodes, links } structure. Keeps the visualization component dumb.

export type BrainGraphNode = {
  id: string;
  label: string;
  kind: "root" | "cluster" | "asset" | "assessment" | "note" | "brief" | "chat" | "memory" | "hero" | "source";
  cluster: string;
  radius: number;
  color: string; // CSS var reference, e.g. "var(--brain-asset)"
  data?: Record<string, unknown>;
};

export type BrainGraphLink = {
  source: string;
  target: string;
  strength?: number;
};

export type BrainGraph = { nodes: BrainGraphNode[]; links: BrainGraphLink[] };

export type MemoryRow = { id: string; kind: string; title: string | null; source_ref: string | null; content?: string | null };
export type NoteRow = { id: string; content: string; source?: string | null; created_at?: string };
export type DocRow = { id: string; document_type?: string | null; status?: string | null; hero_image_status?: string | null; deep_assessment_status?: string | null };
export type MsgRow = { id: string; role: string; content: string; created_at?: string };
export type SourceRow = { id: string; filename: string; kind?: string | null; origin: "snapshot" | "upload" | "url" };

const CLUSTER_META: Record<string, { label: string; color: string }> = {
  source:     { label: "Source Briefs",      color: "var(--brain-source)" },
  asset:      { label: "Startup Assets",     color: "var(--brain-asset)" },
  assessment: { label: "Assessments",        color: "var(--brain-assessment)" },
  note:       { label: "Notes",              color: "var(--brain-note)" },
  brief:      { label: "Brief",              color: "var(--brain-brief)" },
  chat:       { label: "Chat Topics",        color: "var(--brain-chat)" },
  memory:     { label: "Memory Fragments",   color: "var(--brain-memory)" },
  hero:       { label: "Hero Images",        color: "var(--brain-hero)" },
};


function memoryKindToCluster(kind: string): keyof typeof CLUSTER_META {
  const k = (kind || "").toLowerCase();
  if (k.includes("assess")) return "assessment";
  if (k.includes("note")) return "note";
  if (k.includes("brief")) return "brief";
  if (k.includes("deliverable") || k.includes("asset")) return "asset";
  return "memory";
}

function shortTitle(s: string | null | undefined, max = 60) {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "Untitled";
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function humanizeDocType(key: string | null | undefined): string {
  if (!key) return "Asset";
  return key
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildBrainGraph(input: {
  company: string | null;
  memory: MemoryRow[];
  notes: NoteRow[];
  docs: DocRow[];
  messages: MsgRow[];
  docTypeNames?: Record<string, string>;
  sources?: SourceRow[];

}): BrainGraph {
  const nodes: BrainGraphNode[] = [];
  const links: BrainGraphLink[] = [];
  const seenClusters = new Set<string>();
  const nameFor = (key: string | null | undefined) =>
    (key && input.docTypeNames?.[key]) || humanizeDocType(key);

  const rootId = "root";
  nodes.push({
    id: rootId,
    label: input.company || "Your Startup",
    kind: "root",
    cluster: "root",
    radius: 14,
    color: "var(--primary)",
  });

  const ensureCluster = (key: keyof typeof CLUSTER_META) => {
    const id = `cluster:${key}`;
    if (seenClusters.has(id)) return id;
    seenClusters.add(id);
    const meta = CLUSTER_META[key];
    nodes.push({
      id,
      label: meta.label,
      kind: "cluster",
      cluster: key,
      radius: 9,
      color: meta.color,
    });
    links.push({ source: rootId, target: id, strength: 0.4 });
    return id;
  };

  // Documents (assets + hero images).
  for (const d of input.docs) {
    const clusterId = ensureCluster("asset");
    const nid = `doc:${d.id}`;
    const docLabel = nameFor(d.document_type);
    nodes.push({
      id: nid,
      label: shortTitle(docLabel),
      kind: "asset",
      cluster: "asset",
      radius: d.deep_assessment_status === "complete" ? 6 : 4.5,
      color: CLUSTER_META.asset.color,
      data: { docId: d.id, documentType: d.document_type, name: docLabel },
    });
    links.push({ source: clusterId, target: nid });

    if (d.deep_assessment_status === "complete") {
      const aClusterId = ensureCluster("assessment");
      const aId = `assess:${d.id}`;
      nodes.push({
        id: aId,
        label: shortTitle(`${docLabel} — Assessment`),
        kind: "assessment",
        cluster: "assessment",
        radius: 4,
        color: CLUSTER_META.assessment.color,
        data: { docId: d.id, name: `${docLabel} — Assessment` },
      });
      links.push({ source: aClusterId, target: aId });
      links.push({ source: nid, target: aId, strength: 0.8 });
    }

    if (d.hero_image_status === "ready") {
      const hClusterId = ensureCluster("hero");
      const hId = `hero:${d.id}`;
      nodes.push({
        id: hId,
        label: shortTitle(`${docLabel} — Hero Image`),
        kind: "hero",
        cluster: "hero",
        radius: 3.5,
        color: CLUSTER_META.hero.color,
        data: { docId: d.id, name: `${docLabel} — Hero Image` },
      });
      links.push({ source: hClusterId, target: hId });
      links.push({ source: nid, target: hId, strength: 0.6 });
    }
  }

  // Memory rows — dedupe generic chunk titles into one node with count.
  const assetRefs = new Set(input.docs.map((d) => (d.document_type || "").toString()));
  type Grp = { kind: keyof typeof CLUSTER_META; label: string; count: number; ids: string[]; sourceRef: string | null };
  const groups = new Map<string, Grp>();
  for (const m of input.memory) {
    const k = memoryKindToCluster(m.kind);
    if (k === "asset" && m.source_ref && assetRefs.has(m.source_ref)) continue;
    // Prefer real deliverable name when source_ref matches a document_type.
    const resolvedName =
      (m.source_ref && input.docTypeNames?.[m.source_ref]) ||
      m.title ||
      humanizeDocType(m.kind);
    const key = `${k}::${m.source_ref ?? ""}::${resolvedName}`;
    const g = groups.get(key);
    if (g) {
      g.count += 1;
      g.ids.push(m.id);
    } else {
      groups.set(key, { kind: k, label: resolvedName, count: 1, ids: [m.id], sourceRef: m.source_ref });
    }
  }
  for (const [key, g] of groups) {
    const clusterId = ensureCluster(g.kind);
    const nid = `memg:${key}`;
    const label = g.count > 1 ? `${g.label} (×${g.count})` : g.label;
    nodes.push({
      id: nid,
      label: shortTitle(label),
      kind: g.kind === "asset" ? "asset" : (g.kind as BrainGraphNode["kind"]),
      cluster: g.kind,
      radius: Math.min(6, 3.5 + Math.log2(g.count + 1) * 0.6),
      color: CLUSTER_META[g.kind].color,
      data: { memIds: g.ids, sourceRef: g.sourceRef, count: g.count, name: g.label },
    });
    links.push({ source: clusterId, target: nid });
  }

  // Notes.
  for (const n of input.notes) {
    const clusterId = ensureCluster("note");
    const title = shortTitle(n.content.replace(/[*#>_`~-]/g, " ").trim(), 60);
    const nid = `note:${n.id}`;
    nodes.push({
      id: nid,
      label: title,
      kind: "note",
      cluster: "note",
      radius: 4,
      color: CLUSTER_META.note.color,
      data: { noteId: n.id },
    });
    links.push({ source: clusterId, target: nid });
  }

  // Last ~20 user chat questions as "topics".
  const topics = input.messages.filter((m) => m.role === "user").slice(-20);
  for (const t of topics) {
    const clusterId = ensureCluster("chat");
    const nid = `chat:${t.id}`;
    nodes.push({
      id: nid,
      label: shortTitle(t.content, 60),
      kind: "chat",
      cluster: "chat",
      radius: 3,
      color: CLUSTER_META.chat.color,
      data: { messageId: t.id },
    });
    links.push({ source: clusterId, target: nid });
  }

  return { nodes, links };
}

export const BRAIN_CLUSTER_META = CLUSTER_META;

