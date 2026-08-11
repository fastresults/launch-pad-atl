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
  /** What the build already delivered — the starting line, not new scope. */
  have: string;
  /** What carrying the rest alone actually looks like for the founder. */
  you: string;
  /** The role that carries it on our side, and the state you end up in. */
  we: string;
  role: string;
};

const CLUSTERS: Cluster[] = [
  {
    key: "entity",
    label: "Entity filed and the legal base in force",
    match: /entity|ein|operating-agreement|registered-agent|license|insurance|state|contract|msa|terms|privacy/,
    have: "Recommended structure, and terms written around how your offer actually sells.",
    you: "Work out the state's filing path yourself, chase the EIN and licences, and hope the paperwork matches what you sell.",
    we: "Filed, EIN issued, agent and licences in place, and your agreement and contracts executed — the recommendation turned into a real entity.",
    role: "Formation specialist",
  },
  {
    key: "books",
    label: "Books configured to your model",
    match: /bank|qbo|quickbooks|chart-of-accounts|bookkeep|invoice|payment|stripe|tax|payroll/,
    have: "Your model, price points and revenue lines already defined.",
    you: "Open the accounts, map a chart of accounts to lines you've never booked, and reconcile it every month.",
    we: "QuickBooks configured to those exact revenue lines, banking and payments connected, invoicing tested end to end.",
    role: "Bookkeeping lead",
  },
  {
    key: "offer",
    label: "Offer pressure-tested on live buyers",
    match: /offer|price|pricing|proposal|package|guarantee/,
    have: "A priced offer, guarantee and positioning from the build.",
    you: "Take it to market cold, discount under pressure, and rewrite it after the first ten calls go sideways.",
    we: "The written offer tested against real conversations — terms, guarantee and objection language tightened, then locked.",
    role: "Offer strategist",
  },
  {
    key: "crm",
    label: "CRM stood up and loaded",
    match: /ghl|crm|a2p|pipeline|automation|sequence|nurture|sms|dialer/,
    have: "Pipeline logic, follow-up sequences and messaging already written.",
    you: "Learn the platform, register A2P, and rebuild the written sequences into automations that misfire the first few passes.",
    we: "Sub-account built, A2P approved, your sequences loaded into live pipelines and tested against real records.",
    role: "Systems engineer",
  },
  {
    key: "funnel",
    label: "Funnel assembled and tracked",
    match: /funnel|lead|list|magnet|capture|retarget|landing/,
    have: "Lead magnet concept, capture copy and the nurture arc.",
    you: "Stitch the pieces into a builder, wire the forms, and guess why the numbers stay flat.",
    we: "Magnet, capture, nurture and retargeting connected end to end — with tracking that proves which step converts.",
    role: "Growth lead",
  },
  {
    key: "site",
    label: "Website built from your PRD",
    match: /site|website|prd|domain|hosting|analytics|seo/,
    have: "The website PRD, art direction and written page copy.",
    you: "Translate the PRD into a builder yourself, and settle for a page that drifts from the direction you approved.",
    we: "Built to the PRD without dilution, live on your domain, analytics and search reading properly on day one.",
    role: "Creative director + copywriter",
  },
  {
    key: "brand",
    label: "Brand system elevated and produced",
    match: /brand|logo|collateral|guideline|card|letterhead|signoff|sign-off|art-direction|foundation-grade/,
    have: "Your mark, palette, type, voice and the full collateral set.",
    you: "Run the set as delivered and watch it drift as each new piece gets made in a different tool.",
    we: "The set graded against your category, a written art direction over it, the system refined to that direction, and the collateral set produced at print standard.",
    role: "Creative director + brand designer",
  },
  {
    key: "campaign",
    label: "Campaign elevated and run",
    match: /campaign|ad|content|social|creative|post|cover|launch|imagery|poster|motion/,
    have: "The eight-week campaign arc and your foundation poster set.",
    you: "Publish the starter frames as-is, then lose the thread around week three when the calendar gets busy.",
    we: "Original art-directed imagery in place of stock, the poster system rebuilt to your direction, and the eight-week arc run to a standard we sign off.",
    role: "Campaign director",
  },
];

const slugOf = (t: OpsTask) =>
  `${t.task_key} ${t.title}`.toLowerCase();

export function HeavyLifting({ tasks }: { tasks: OpsTask[] }) {
  const rows = useMemo(() => {
    // Each step counts once: first matching cluster claims it, so the totals
    // here reconcile with the step count on the summary above.
    const claimed = new Set<string>();
    const bucket = new Map<string, OpsTask[]>();
    for (const t of tasks) {
      const slug = slugOf(t);
      const c = CLUSTERS.find((x) => x.match.test(slug));
      if (!c || claimed.has(t.task_key)) continue;
      claimed.add(t.task_key);
      bucket.set(c.key, [...(bucket.get(c.key) ?? []), t]);
    }
    return CLUSTERS.map((c) => {
      const hit = bucket.get(c.key) ?? [];
      return { ...c, count: hit.length, minutes: hit.reduce((s, t) => s + (t.minutes ?? 0), 0) };
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
        The foundation is already yours. These are the moves that turn it into a business that
        runs — the same milestones either way. The only question is who carries them.
      </p>

      <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 px-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:grid">
        <span>You carry it from here</span>
        <span className="text-primary">We carry it from here</span>
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
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
              <span className="text-foreground/60">Already yours from the build:</span> {r.have}
            </p>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="sm:hidden font-medium text-foreground/80">You carry it: </span>
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
