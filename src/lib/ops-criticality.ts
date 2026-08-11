// How badly the business needs a step — and the words we use to say so.
import { categoryLabel, type OpsTask } from "@/lib/ops-runway";

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
    // One vocabulary everywhere: the chip and the explainer say the same words.
    short: "Required to operate",
    tip: "Without this you are not legally or practically in business. Filing, banking, invoicing, contracts — skip one and something downstream stops working or exposes you.",
    badge: "border-destructive/50 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  required_to_sell: {
    label: "Required to sell",
    short: "Required to sell",
    tip: "You can exist without this, but you cannot reliably take money. The offer, the price, the booking link, the pipeline — this is the machinery that turns interest into revenue.",
    badge: "border-amber-500/50 bg-amber-400/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  growth: {
    label: "Makes it grow",
    short: "Makes it grow",
    tip: "An accelerator. Nothing breaks if it waits a week, but this is what compounds — content, retargeting, referrals, reviews, pricing discipline.",
    badge: "border-sky-500/50 bg-sky-400/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
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

/** Per-lane framing, used as the lead-in for a step-specific tooltip. */
const CATEGORY_ROLE: Record<string, string> = {
  Offer: "Offer work — what you sell, what it costs, and why someone says yes.",
  Strategy: "Strategy work — the decisions everything downstream gets built on.",
  Legal: "Legal and entity work — what makes the business real and protected.",
  Money: "Money plumbing — how cash comes in, gets tracked, and stays clean.",
  Sales: "Sales machinery — how interest turns into signed, paid work.",
  Demand: "Demand work — how the right people find out you exist.",
  Marketing: "Demand work — how the right people find out you exist.",
  Brand: "Brand work — how the business looks and sounds everywhere it shows up.",
  Creative: "Creative work — the art direction that lifts the foundation set to agency grade.",
  Content: "Content work — the posts and sends that keep you in front of buyers.",
  Systems: "Systems work — the tools and automations that do the remembering for you.",
  Run: "Delivery work — how the promise gets kept after someone pays.",
  Rhythm: "Operating rhythm — the recurring habits that keep the business honest.",
  Growth: "Growth work — what compounds once the basics hold.",
};

const firstLine = (t: OpsTask) => t.how?.[0] ?? t.done_when ?? "";

/**
 * A tooltip that actually describes THIS step: what the lane is for, what the
 * step does, and the first concrete move. Never the same string twice.
 */
export function categoryTip(task: OpsTask): string {
  const lane = categoryLabel(task.category);
  const role = CATEGORY_ROLE[lane] ?? `${lane} work.`;

  const what = task.why ? ` This step: ${task.why}` : "";
  const first = firstLine(task);
  return `${role}${what}${first ? ` Start by: ${first.replace(/^\w/, (c) => c.toLowerCase())}` : ""}`;
}

/** Criticality, said in terms of this specific step and what it holds up. */
export function criticalityTip(task: OpsTask, all: OpsTask[] = []): string {
  const meta = critMeta(task);
  const level = criticalityOf(task);
  const gated = unlockedBy(task, all).map((t) => t.title);
  const consequence = gated.length
    ? ` Leave it and these stall: ${gated.slice(0, 3).join(", ")}.`
    : level === "required_to_operate"
      ? " Leave it and you're operating exposed — no clean paperwork, no clean books."
      : level === "required_to_sell"
        ? " Leave it and interest has nowhere to become revenue."
        : " Safe to do after the essentials are holding.";
  return `${task.title} is ${meta.label.toLowerCase()}.${consequence} ${meta.tip}`;
}

/** Owner line, named for the actual step. */
export function ownerTip(task: OpsTask, mine: boolean): string {
  return mine
    ? `"${task.title}" is yours. Nobody else can close it out, and the steps behind it wait on you.`
    : `"${task.title}" sits with Adam's team. You'll see it move without doing anything — nudge us if it stalls.`;
}

/** Time estimate, framed around this step's own work. */
export function minutesTip(task: OpsTask, label: string): string {
  const steps = task.how?.length ?? 0;
  return `About ${label} of focused work${steps ? ` across ${steps} step${steps > 1 ? "s" : ""}` : ""} to finish "${task.title}". Done when: ${task.done_when}`;
}

/** Status, framed around this step. */
export function statusTip(task: OpsTask, plain: string): string {
  return `"${task.title}" — ${plain.toLowerCase()}. ${TIPS.status[task.status] ?? ""}`;
}
