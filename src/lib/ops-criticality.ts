// How badly the business needs a step — and the words we use to say so.
import type { OpsTask } from "@/lib/ops-runway";

export type OpsCriticality = "required_to_operate" | "required_to_sell" | "growth";

export const CRITICALITY: Record<OpsCriticality, {
  label: string;
  short: string;
  tip: string;
  badge: string;
  dot: string;
}> = {
  required_to_operate: {
    label: "Required to operate",
    short: "Must have",
    tip: "Without this you are not legally or practically in business. Filing, banking, invoicing, contracts — skip one and something downstream stops working or exposes you.",
    badge: "border-destructive/50 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  required_to_sell: {
    label: "Required to sell",
    short: "Needed to sell",
    tip: "You can exist without this, but you cannot reliably take money. The offer, the price, the booking link, the pipeline — this is the machinery that turns interest into revenue.",
    badge: "border-amber-400/50 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  growth: {
    label: "Makes it grow",
    short: "Growth",
    tip: "An accelerator. Nothing breaks if it waits a week, but this is what compounds — content, retargeting, referrals, reviews, pricing discipline.",
    badge: "border-sky-400/50 bg-sky-400/10 text-sky-300",
    dot: "bg-sky-400",
  },
};

export const criticalityOf = (t: OpsTask): OpsCriticality =>
  (t.criticality as OpsCriticality) ?? "required_to_sell";

export const critMeta = (t: OpsTask) => CRITICALITY[criticalityOf(t)];

/** Resolve the slugs a step gates into the real step titles the founder will recognise. */
export function unlockedBy(task: OpsTask, all: OpsTask[]): OpsTask[] {
  const slugs = task.unlocks ?? [];
  if (!slugs.length) return [];
  const bySlug = new Map<string, OpsTask>();
  for (const t of all) bySlug.set(t.task_key.split(".").pop() ?? t.task_key, t);
  return slugs.map((s) => bySlug.get(s)).filter((t): t is OpsTask => !!t);
}

/** Plain-language explanations for everything else that used to be silent. */
export const TIPS = {
  category: "The kind of work this is. It groups with everything else in the same lane so you can batch it.",
  ownerYou: "This one is yours. Nobody else is going to do it, and the next step waits on it.",
  ownerAgency: "Adam's team owns this. You'll see it move without doing anything — nudge us if it stalls.",
  due: "The day this should be done by, counted from when your runway started. Slipping one day is fine; slipping a week moves everything behind it.",
  progress: "One hundred percent means fully operational: legally set up, able to take money, and running on a weekly rhythm you can keep.",
  minutes: "Rough time on task if you sit down and do it in one go. Most steps take less time than deciding to start them.",
  snoozed: "Put off for now. It comes back into your queue in a few days — it hasn't gone away.",
  stuck: "Flagged as stuck. Whatever you wrote in the note is visible to Adam's team.",
  status: {
    todo: "Nobody has started this yet.",
    in_progress: "Someone is actively working on it right now.",
    waiting_client: "Parked until the founder supplies something — a decision, a document, or a login.",
    blocked: "Something is genuinely in the way. It needs a person, not more time.",
    done: "Finished, with the result saved somewhere the team can find it.",
  } as Record<string, string>,
};
