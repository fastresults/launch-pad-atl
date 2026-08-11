// Which moves are launch-defining, and where Adam's team's experience carries
// the weight. Derived entirely from data already on the task — no schema change.
import type { OpsTask } from "@/lib/ops-runway";
import { criticalityOf } from "@/lib/ops-criticality";

export type OpsSignificance = "milestone" | "supporting";
export type OpsLead = "agency" | "founder" | "together";

const slugOf = (t: OpsTask) => (t.task_key.split(".").pop() ?? t.task_key).toLowerCase();

/** Slug fragments that are launch-defining no matter how they were seeded. */
const MILESTONE_MARKERS = [
  "entity", "ein", "bank", "insurance", "license", "operating-agreement",
  "qbo-connect", "chart-of-accounts", "offer", "price", "pricing",
  "ghl-subaccount", "a2p", "pipeline", "funnel", "site-live", "website",
  "launch", "campaign-live", "first-send", "signoff", "sign-off",
  "art-direction", "imagery-production",
];

/** A launch-defining move, versus the errands that feed it. */
export function significanceOf(t: OpsTask): OpsSignificance {
  if (t.task_key.endsWith(".anchor")) return "milestone";
  const slug = slugOf(t);
  if (MILESTONE_MARKERS.some((m) => slug.includes(m))) return "milestone";
  if ((t.unlocks?.length ?? 0) >= 2) return "milestone";
  if (criticalityOf(t) === "required_to_operate" && (t.minutes ?? 0) >= 60) return "milestone";
  return "supporting";
}

export const isMilestone = (t: OpsTask) => significanceOf(t) === "milestone";

/** Who carries the weight on this one. */
export function leadOf(t: OpsTask): OpsLead {
  if (t.owner_kind === "agency") {
    // Agency work that still needs the founder in the room to finish.
    const needsFounder = (t.needs ?? []).some((n) =>
      /login|your |decision|approve|sign|card|bank|id\b/i.test(n),
    );
    return needsFounder ? "together" : "agency";
  }
  return "founder";
}

export const LEAD_META: Record<OpsLead, { label: string; short: string; badge: string }> = {
  agency: {
    label: "Adam's team leads",
    short: "We lead",
    badge: "border-primary/50 bg-primary/10 text-primary",
  },
  together: {
    label: "We do this together",
    short: "Together",
    badge: "border-violet-400/50 bg-violet-400/10 text-violet-300",
  },
  founder: {
    label: "You lead",
    short: "You lead",
    badge: "border-border/60 bg-muted/30 text-muted-foreground",
  },
};

/** The specific skill being applied, keyed off the step's own slug. */
const AGENCY_SKILL: [RegExp, string][] = [
  [/entity|operating-agreement|registered-agent|state/, "entity structure and state filing — the part people get wrong once and pay for twice"],
  [/ein|tax|accountant/, "tax registration and how the books are set up from day one"],
  [/bank|payment|stripe|invoice/, "money plumbing: accounts, processing and how cash actually lands"],
  [/qbo|quickbooks|chart-of-accounts/, "QuickBooks setup and a chart of accounts built for this business, not a template"],
  [/ghl|crm|a2p|pipeline|automation/, "CRM build, A2P registration and the automations that follow up when you don't"],
  [/funnel|lead|list|nurture|retarget/, "funnel architecture and list building that has run for other ventures already"],
  [/offer|price|pricing|proposal/, "offer design and pricing — what the market will actually pay"],
  [/site|website|landing|prd/, "site architecture and conversion copy at studio standard"],
  [/art-direction|foundation-grade/, "art direction — the written point of view that turns a foundation set into work that looks bought, not generated"],
  [/imagery|photograph|shoot|motion/, "art buying and production: owned imagery and motion shot to one light, crop and colour language"],
  [/poster|template|format/, "the poster and ad system rebuilt to one hierarchy, so every format reads as the same brand"],
  [/brand|logo|collateral|guideline/, "brand system refinement and print-grade collateral, exported at bleed in the right colour profile"],
  [/campaign|ad|content|social|creative/, "campaign art direction and creative sign-off"],
  [/contract|msa|terms|privacy|compliance/, "contracts and compliance language that holds up"],
];

/** One line naming why the experience matters here. Never blank. */
export function agencySkillNote(t: OpsTask): string {
  const slug = slugOf(t);
  const hit = AGENCY_SKILL.find(([re]) => re.test(slug) || re.test(t.title.toLowerCase()));
  if (hit) return hit[1];
  return `${t.category.toLowerCase()} work we've run end to end before — you get the version that already works`;
}

/** Why a milestone is different from the errands around it. */
export function milestoneNote(t: OpsTask, all: OpsTask[]): string {
  const gates = (t.unlocks?.length ?? 0);
  if (gates >= 2) return `A hinge point — ${gates} later steps wait on this one.`;
  if (criticalityOf(t) === "required_to_operate") return "The business is not legally or practically running until this is true.";
  if (criticalityOf(t) === "required_to_sell") return "You cannot reliably take money until this one is done.";
  return "A step the whole week is pointed at.";
}

/** Milestone progress for a set of steps. */
export function milestoneProgress(tasks: OpsTask[]) {
  const ms = tasks.filter(isMilestone);
  const done = ms.filter((t) => t.status === "done").length;
  return { done, total: ms.length };
}

/**
 * Group rows so each milestone carries the supporting steps that follow it.
 * Supporting steps before the first milestone come back as a leading orphan group.
 */
export function groupByMilestone(rows: OpsTask[]) {
  const groups: { milestone: OpsTask | null; supporting: OpsTask[] }[] = [];
  for (const t of rows) {
    if (isMilestone(t) || !groups.length) {
      groups.push({ milestone: isMilestone(t) ? t : null, supporting: isMilestone(t) ? [] : [t] });
    } else {
      groups[groups.length - 1].supporting.push(t);
    }
  }
  return groups;
}
