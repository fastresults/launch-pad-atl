// Art direction for the operating runway: one mapping from a runway category
// to its drawn mark and colour treatment, so the same category always reads
// the same way in guided mode, the checklist, the timeline and the share link.

export type OpsGlyphName =
  | "Foundation" | "Strategy" | "Operations" | "Finance"
  | "Governance" | "Brand" | "Marketing" | "Social & Content" | "Creative";

export type OpsArt = {
  /** Text colour for the glyph stroke. */
  ink: string;
  /** Soft plate behind the glyph. */
  plate: string;
  /** Hairline ring around the plate. */
  ring: string;
};

const ART: Record<string, OpsArt> = {
  Foundation: { ink: "text-primary", plate: "bg-primary/10", ring: "ring-primary/25" },
  Strategy: { ink: "text-indigo-400", plate: "bg-indigo-400/10", ring: "ring-indigo-400/25" },
  Operations: { ink: "text-teal-400", plate: "bg-teal-400/10", ring: "ring-teal-400/25" },
  Finance: { ink: "text-amber-400", plate: "bg-amber-400/10", ring: "ring-amber-400/25" },
  Governance: { ink: "text-slate-400", plate: "bg-slate-400/10", ring: "ring-slate-400/25" },
  Brand: { ink: "text-fuchsia-400", plate: "bg-fuchsia-400/10", ring: "ring-fuchsia-400/25" },
  Marketing: { ink: "text-sky-400", plate: "bg-sky-400/10", ring: "ring-sky-400/25" },
  "Social & Content": { ink: "text-rose-400", plate: "bg-rose-400/10", ring: "ring-rose-400/25" },
  Creative: { ink: "text-violet-400", plate: "bg-violet-400/10", ring: "ring-violet-400/25" },
};

const FALLBACK: OpsArt = {
  ink: "text-muted-foreground", plate: "bg-muted/40", ring: "ring-border/60",
};

export const artOf = (category?: string | null): OpsArt =>
  (category && ART[category]) || FALLBACK;

/** One-line reading of what the category covers, for tooltips and headers. */
export const CATEGORY_BLURB: Record<string, string> = {
  Foundation: "The concept, the promise, and who it's for.",
  Strategy: "The offer, the price, and the wedge you win on.",
  Operations: "The machine that delivers the work every week.",
  Finance: "Books, invoicing, and knowing your numbers.",
  Governance: "Entity, filings, and staying legal.",
  Brand: "The mark, palette and voice, made consistent.",
  Marketing: "Funnels, lists and the way demand reaches you.",
  "Social & Content": "What you publish, and how often.",
  Creative: "Lifting the foundation set to agency standard.",
};
