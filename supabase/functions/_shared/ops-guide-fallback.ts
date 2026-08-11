// Coverage guarantee for guided mode: every runway step gets a usable
// explanation even when nobody hand-authored one.
//
// Deterministic — derived from category, stage, owner and the step's own
// `why` / `done_when`. Authored guides in ops-guides.ts always win.

export type OpsCriticality = "required_to_operate" | "required_to_sell" | "growth";

type Seed = {
  phase: number;
  day: number;
  task_key: string;
  title: string;
  why: string;
  done_when: string;
  category: string;
  owner_kind: "client" | "agency";
};

/** Slug fragments that mean "the business is not legally or practically running without this". */
const OPERATE_MARKERS = [
  "entity", "ein", "bank", "license", "insurance", "registered-agent", "operating-agreement",
  "qbo", "quickbooks", "invoice", "tax", "accountant", "compliance", "contract", "msa",
  "domain", "email", "phone", "terms", "privacy", "payment", "stripe", "chart-of-accounts",
];

/** Slug fragments that mean "you cannot reliably take money without this". */
const SELL_MARKERS = [
  "offer", "price", "pricing", "booking", "crm", "ghl", "pipeline", "proposal", "outreach",
  "list", "lead", "funnel", "site", "website", "landing", "one-liner", "icp", "buyer",
  "sales", "follow-up", "close", "calendar", "a2p", "nurture",
];

const GROWTH_CATEGORIES = new Set(["Social & Content", "Marketing", "Creative", "Brand"]);

/** How critical this step is to actually being operational. */
export function criticalityFor(t: Seed): OpsCriticality {
  const slug = t.task_key.split(".").pop() ?? t.task_key;
  const hay = `${slug} ${t.title.toLowerCase()}`;
  if (t.category === "Finance" || t.category === "Governance") return "required_to_operate";
  if (OPERATE_MARKERS.some((m) => hay.includes(m))) return "required_to_operate";
  if (SELL_MARKERS.some((m) => hay.includes(m))) return "required_to_sell";
  if (GROWTH_CATEGORIES.has(t.category) && t.phase >= 3) return "growth";
  if (t.phase >= 4) return "growth";
  if (GROWTH_CATEGORIES.has(t.category)) return "growth";
  return "required_to_sell";
}

/** Typical time on task when nobody measured it, by category and owner. */
function minutesFor(t: Seed): number {
  const base: Record<string, number> = {
    Foundation: 45, Strategy: 60, Operations: 60, Finance: 75, Governance: 90,
    Brand: 45, Marketing: 60, "Social & Content": 45, Creative: 60,
  };
  const m = base[t.category] ?? 45;
  // Anchor tasks are the whole day's objective, not a single errand.
  return t.task_key.endsWith(".anchor") ? m * 2 : m;
}

/** What to have in hand, inferred from the kind of work. */
function needsFor(t: Seed): string[] {
  const c = t.category;
  if (c === "Finance") return ["Your EIN and entity details", "A business bank login"];
  if (c === "Governance") return ["Your entity paperwork", "The state or agency portal login"];
  if (c === "Operations") return ["Logins for the tools in your stack"];
  if (c === "Brand" || c === "Creative") return ["Your brand kit and logo files"];
  if (c === "Marketing" || c === "Social & Content") return ["Your offer, your one-liner, and your brand kit"];
  if (c === "Strategy") return ["Your venture brief and anything you've heard from real buyers"];
  return ["30 uninterrupted minutes"];
}

/**
 * A four-step how-to built from the step's own words. Generic by design — it
 * gives a founder a shape to follow instead of a blank panel.
 */
function howFor(t: Seed): string[] {
  const who = t.owner_kind === "agency" ? "Adam's team" : "you";
  const doer = t.owner_kind === "agency"
    ? "Confirm with Adam's team who is doing this and by when."
    : "Block the time on your calendar before you start — this does not happen in the gaps.";

  return [
    doer,
    `Open what you already have for this: ${t.category.toLowerCase()} work in your showcase, plus anything from the brief that touches it.`,
    `Do the smallest complete version. The bar is exactly this: ${lowerFirst(t.done_when)}`,
    `Save the result somewhere the whole team can find it, then mark this done. If ${who} hit a wall, flag it as stuck rather than leaving it open.`,
  ];
}

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

export function fallbackGuide(t: Seed) {
  return {
    how: howFor(t),
    needs: needsFor(t),
    minutes: minutesFor(t),
    criticality: criticalityFor(t),
  };
}
