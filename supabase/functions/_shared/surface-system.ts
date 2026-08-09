/**
 * Surface system contract.
 *
 * The PRD used to name colours but never named *surfaces*, so the builder
 * invented one per section: a light card dropped onto a dark page kept the
 * dark-page foreground and the row labels vanished, and testimonial quotes
 * shipped white-on-white.
 *
 * The ladder below is injected verbatim into the PRD so every component
 * declares the surface it sits on and carries its paired foreground.
 */

export type SurfaceLevel = {
  /** Token name used throughout the PRD. */
  name: string;
  /** What the surface is for. */
  role: string;
  /** The four tokens that always travel together. */
  tokens: string[];
};

export const SURFACE_LADDER: SurfaceLevel[] = [
  {
    name: "page",
    role: "The route's base canvas. One per route, set by the route's declared page mode.",
    tokens: ["--page", "--page-foreground", "--page-muted-foreground", "--page-border"],
  },
  {
    name: "surface",
    role: "Default content surface: sections, panels, table bodies, form wells.",
    tokens: ["--surface", "--surface-foreground", "--surface-muted-foreground", "--surface-border"],
  },
  {
    name: "surface-raised",
    role: "Cards, pricing tiers, testimonial cards, FAQ rows, popovers — anything lifted off the section.",
    tokens: [
      "--surface-raised",
      "--surface-raised-foreground",
      "--surface-raised-muted-foreground",
      "--surface-raised-border",
    ],
  },
  {
    name: "surface-inverted",
    role: "Deliberate flips: CTA bands, footers, feature callouts that invert the page mode.",
    tokens: [
      "--surface-inverted",
      "--surface-inverted-foreground",
      "--surface-inverted-muted-foreground",
      "--surface-inverted-border",
    ],
  },
  {
    name: "overlay",
    role: "Type sitting over imagery or a scrim: hero copy, image captions, modals, sticky bars.",
    tokens: ["--overlay", "--overlay-foreground", "--overlay-muted-foreground", "--overlay-border"],
  },
];

/** Components that must each name a surface in the Section 8 inventory. */
export const SURFACE_INVENTORY_COMPONENTS = [
  "header / nav",
  "announcement bar",
  "hero",
  "card",
  "feature / bento tile",
  "comparison or spec table",
  "pricing tier",
  "testimonial card",
  "FAQ row",
  "form field",
  "badge / pill",
  "CTA band",
  "footer",
  "404",
  "cookie banner",
];

/** The full surface contract injected into the Website PRD prompt. */
export function surfaceSystemBlock(): string {
  return [
    "## SURFACE SYSTEM CONTRACT (LOCKED)",
    "Colour alone is not a design system. Every background in this site belongs to one named surface, and **the foreground always travels with its surface**: any element that changes its background MUST also set the paired foreground, muted-foreground and border tokens. No component may inherit text colour across a surface boundary. A light card on a dark page whose labels keep the dark-page foreground is a hard failure, and so is white text on a white card.",
    "",
    "### The ladder",
    ...SURFACE_LADDER.map((s) =>
      `- **${s.name}** — ${s.role} Tokens: \`${s.tokens.join("`, `")}\`. Defined once for light theme and once for dark theme, with a stated contrast ratio of at least 4.5:1 between the surface and its foreground (3:1 for muted-foreground and large display type).`
    ),
    "",
    "### Rules",
    "- Each route declares exactly one **page mode**: light-dominant or dark-dominant.",
    "- Inverted sections are allowed but must be listed by name for that route, each stating the token pair it flips to and flipping every child element with it.",
    "- Tables state the surface and foreground pair for the header row, the label column, the value cells, the borders and the zebra rows separately — the label column is the cell that fails most often.",
    "- Images and scrims use the `overlay` surface for any type placed on them; the scrim is a token-based gradient, and the overlay foreground is declared alongside it.",
    "- **Theme parity**: every token pair defined for the light theme has a dark-theme counterpart. No section may be styled for one theme only.",
    "- Never use raw `text-white`, `bg-black`, `#fff` or a bare hex on a component. Components reference surface tokens only.",
  ].join("\n");
}

/** Compact restatement for the paste-ready master prompt. */
export function surfaceSystemSummary(): string {
  return [
    "Surface ladder (locked):",
    SURFACE_LADDER.map((s) => `${s.name} (${s.tokens.join(", ")})`).join("; "),
    "— foreground always travels with its surface; no element inherits text colour across a surface boundary; every pair defined for light has a dark counterpart; tables declare header, label column, value cells, borders and zebra rows separately; all surface/foreground pairs meet 4.5:1.",
  ].join(" ");
}
