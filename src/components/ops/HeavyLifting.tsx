import { useMemo } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { OpsTask } from "@/lib/ops-runway";
import { hours } from "@/lib/ops-investment";

/**
 * The heavy lifting: the major moves inside this venture's runway, and what
 * each one actually costs the founder versus what our team hands over.
 * Everything is derived from the venture's own step list — no invented scope.
 */

type Cluster = {
  key: string;
  label: string;
  match: RegExp;
  /** What the founder has to become good at to do this alone. */
  you: string;
  /** The role that does it on our side, and the artifact you receive. */
  we: string;
  role: string;
};

const CLUSTERS: Cluster[] = [
  {
    key: "entity",
    label: "Entity, EIN and the legal base",
    match: /entity|ein|operating-agreement|registered-agent|license|insurance|state|contract|msa|terms|privacy/,
    you: "Read state rules, pick a structure, file it, and hope the operating agreement holds later.",
    we: "Structure chosen, filed and documented — with the agreement and contracts drafted around how you actually sell.",
    role: "Formation specialist",
  },
  {
    key: "books",
    label: "Banking, books and QuickBooks",
    match: /bank|qbo|quickbooks|chart-of-accounts|bookkeep|invoice|payment|stripe|tax|payroll/,
    you: "Open accounts, wire a chart of accounts you've never built, reconcile it monthly.",
    we: "QuickBooks live with a chart of accounts built for your model, feeds connected, invoicing tested end to end.",
    role: "Bookkeeping lead",
  },
  {
    key: "offer",
    label: "Offer and pricing",
    match: /offer|price|pricing|proposal|package|guarantee/,
    you: "Guess a number, discount when challenged, rebuild the offer after the first ten calls.",
    we: "A priced offer with the terms, guarantee and objection language tested against real buyers.",
    role: "Offer strategist",
  },
  {
    key: "crm",
    label: "CRM, A2P and automation",
    match: /ghl|crm|a2p|pipeline|automation|sequence|nurture|sms|dialer/,
    you: "Learn a CRM, register A2P, build pipelines and automations that mostly misfire the first time.",
    we: "Sub-account built, A2P approved, pipelines and follow-up automations live and tested with real records.",
    role: "Systems engineer",
  },
  {
    key: "funnel",
    label: "Lists, leads and funnels",
    match: /funnel|lead|list|magnet|capture|retarget|landing/,
    you: "Assemble a lead magnet, a form and a follow-up, then wonder why nothing converts.",
    we: "Capture funnel, magnet, nurture and retargeting wired together — with tracking that proves what worked.",
    role: "Growth lead",
  },
  {
    key: "site",
    label: "Website and conversion copy",
    match: /site|website|prd|domain|hosting|analytics|seo/,
    you: "Wrangle a builder, write your own copy, and settle for a page that looks fine and sells nothing.",
    we: "A conversion-built site with studio art direction, written copy and analytics reading properly on day one.",
    role: "Creative director + copywriter",
  },
  {
    key: "brand",
    label: "Brand system, elevated past the foundation set",
    match: /brand|logo|collateral|guideline|card|letterhead|signoff|sign-off|art-direction|foundation-grade/,
    you: "Keep the generated set as-is and hope it holds together once real customers look closely.",
    we: "The foundation graded against your category, an art direction written, the mark and system refined, and collateral produced to it at print standard.",
    role: "Creative director + brand designer",
  },
  {
    key: "campaign",
    label: "Campaign creative, raised to agency grade",
    match: /campaign|ad|content|social|creative|post|cover|launch|imagery|poster|motion/,
    you: "Publish the starter posters and stock frames — the work that reads as new to anyone who buys often.",
    we: "Owned imagery shot or commissioned, the poster and ad system rebuilt to the art direction, and the standard held across eight weeks.",
    role: "Art buyer + campaign director",
  },
];

const slugOf = (t: OpsTask) =>
  `${t.task_key} ${t.title}`.toLowerCase();

export function HeavyLifting({ tasks }: { tasks: OpsTask[] }) {
  const rows = useMemo(() => {
    return CLUSTERS.map((c) => {
      const hit = tasks.filter((t) => c.match.test(slugOf(t)));
      const minutes = hit.reduce((s, t) => s + (t.minutes ?? 0), 0);
      return { ...c, count: hit.length, minutes };
    })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8);
  }, [tasks]);

  if (!rows.length) return null;

  const totalSteps = rows.reduce((s, r) => s + r.count, 0);
  const totalMinutes = rows.reduce((s, r) => s + r.minutes, 0);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">The heavy lifting</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
        {rows.length} major moves — {totalSteps} steps, {hours(totalMinutes)} of real work
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        These are the same milestones either way. The only question is who carries them.
      </p>

      <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 px-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:grid">
        <span>You do it</span>
        <span className="text-primary">We do it</span>
      </div>

      <ul className="mt-2 space-y-2.5">
        {rows.map((r) => (
          <li key={r.key} className="rounded-xl border border-border/40 bg-background/40 p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {r.count} steps · {hours(r.minutes)}
              </span>
            </div>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="sm:hidden font-medium text-foreground/80">You do it: </span>
                {r.you}
              </p>
              <div className="flex gap-2 rounded-lg border border-primary/25 bg-primary/[0.05] px-3 py-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-foreground/90">
                  {r.we}
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-primary/80">
                    {r.role}
                  </span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ArrowRight className="h-3 w-3 text-primary" />
        Every one of these is included when Adam's team is retained.
      </p>
    </div>
  );
}

export default HeavyLifting;
