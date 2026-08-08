/** Shared model for the radial Second Brain mind map. */

export type MindMapItem = {
  /** Stable key; when present the node becomes clickable. */
  key?: string;
  title: string;
};

export type MindMapBranch = {
  key: string;
  label: string;
  color?: string;
  items: MindMapItem[];
};

export type MindMapModel = {
  center: { label: string; color?: string };
  branches: MindMapBranch[];
};

/** Resolve a CSS var reference like "var(--brain-asset)" against the live DOM. */
export function resolveCssColor(ref: string | null | undefined, fallback: string): string {
  if (!ref) return fallback;
  const value = ref.trim();
  const match = /var\((--[a-z0-9-]+)\)/i.exec(value);
  if (!match) return value;
  if (typeof window === "undefined") return fallback;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  if (!resolved) return fallback;
  // Bare HSL triples (shadcn tokens) need wrapping.
  return /^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(resolved) ? `hsl(${resolved})` : resolved;
}

/** Share payload -> mind map model. */
export function shareToMindMap(payload: any): MindMapModel {
  const sections = (Array.isArray(payload?.sections) ? payload.sections : []).filter(Boolean).slice(0, 18);
  return {
    center: {
      label: String(payload?.venture?.name || "Venture"),
      color: payload?.venture?.colors?.primary ?? undefined,
    },
    branches: sections.map((section: any, index: number) => ({
      key: String(section?.key || `section-${index + 1}`),
      label: String(section?.label || `Section ${index + 1}`),
      items: (Array.isArray(section?.items) ? section.items : [])
        .filter(Boolean)
        .slice(0, 40)
        .map((item: any, i: number) => ({
          key: item?.key ? String(item.key) : undefined,
          title: String(item?.title || `Asset ${i + 1}`),
        })),
    })),
  };
}

type BrainGraphLike = {
  nodes: { id: string; label: string; kind: string; cluster: string; color: string }[];
  links: { source: string; target: string }[];
};

/** Dashboard brain graph -> mind map model (root / cluster / leaf tiers). */
export function brainGraphToMindMap(
  graph: BrainGraphLike,
  opts: { maxPerBranch?: number } = {},
): MindMapModel {
  const maxPerBranch = opts.maxPerBranch ?? 36;
  const root = graph.nodes.find((n) => n.kind === "root");
  const clusters = graph.nodes.filter((n) => n.kind === "cluster");
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const childrenOf = new Map<string, string[]>();
  for (const link of graph.links) {
    const list = childrenOf.get(link.source) ?? [];
    list.push(link.target);
    childrenOf.set(link.source, list);
  }

  return {
    center: { label: root?.label || "Your Startup", color: resolveCssColor(root?.color, "#e0b25c") },
    branches: clusters.map((cluster) => {
      const seen = new Set<string>();
      const items: MindMapItem[] = [];
      for (const childId of childrenOf.get(cluster.id) ?? []) {
        const child = byId.get(childId);
        if (!child || child.kind === "cluster" || seen.has(childId)) continue;
        seen.add(childId);
        if (items.length >= maxPerBranch) continue;
        items.push({ key: child.id, title: child.label });
      }
      const overflow = (childrenOf.get(cluster.id) ?? []).length - items.length;
      if (overflow > 0) items.push({ title: `+${overflow} more` });
      return {
        key: cluster.cluster || cluster.id,
        label: cluster.label,
        color: resolveCssColor(cluster.color, "#7fb3d5"),
        items,
      };
    }),
  };
}
