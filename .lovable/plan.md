
## Goal
Add hover/tap tooltips to each of the eight "What you walk out with" stage rows on `/register` — Strategic Foundation Workshop only. Each tooltip extolls the benefits and outcomes of that stage.

## Scope
Applies only to the fallback (Strategic Foundation Workshop) branch of `RegisterFramework.tsx` — the `FRAMEWORK_STAGES.map(...)` list at lines 281–296. The `ctx.walkOuts` branch used by the eight Build workshops is untouched.

## Changes

**1. `src/lib/framework-deliverables.ts`** — extend `FrameworkStage` with an optional `benefit: string` and add one benefit copy line per stage (Foundation, Strategy, Operations, Finance, Governance, Brand, Marketing, Social & Content). Each ~140–180 chars, outcome-oriented (what the founder walks away able to do), matching the existing plain-language voice of the deliverable tooltips.

Draft copy:
- **Foundation** — "Leave with the one-page story of your startup — vision, problem, and value prop tight enough that customers buy, partners lean in, and hires say yes."
- **Strategy** — "Walk out knowing exactly who you sell to, how you beat the alternatives, and the ninety-day plan that turns the strategy into first paying customers."
- **Operations** — "The roadmap, weekly workflow, and sales playbook that let you deliver reliably — and hand pieces to a teammate without the business breaking."
- **Finance** — "A twelve-month P&L, unit economics, and funding plan you can defend to a banker or investor — and use yourself to price, spend, and hire with confidence."
- **Governance** — "Entity, risk, and advisory scaffolding in place — so you're bankable, insurable, and no longer one bad surprise away from personal exposure."
- **Brand** *(bonus)* — "A brand system — strategy, messaging, visual brief, voice, guidelines — that earns premium pricing and stops you rebuilding your identity every six months."
- **Marketing** *(bonus)* — "A complete website PRD ready to hand to an AI builder — launch a revenue-ready site in a weekend instead of paying $20K and waiting three months."
- **Social & Content** *(bonus)* — "Ninety days of content, a launch kit, and a paid-ads starter pack — a distribution engine that earns attention on repeat instead of costing more each month."

**2. `src/components/register/RegisterFramework.tsx`** — wrap each stage row in the fallback list with a shadcn `Tooltip` (`Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`). Trigger = the existing row (`asChild`), content = `stage.benefit`. Keep the row visually unchanged; add a subtle affordance (`cursor-help` on the trigger). Wrap the `<ul>` in one `TooltipProvider` with `delayDuration={150}`.

No changes to layout, spacing, price card, or the Build-workshops branch.

## Technical notes
- shadcn tooltip already lives at `src/components/ui/tooltip.tsx` (standard install) — no new deps.
- On touch devices, Radix tooltip opens on tap; acceptable per request ("tooltips"), no separate mobile treatment.
- Tooltip content stays short (single sentence) to render cleanly at `max-w-xs`.

## Verification
- Load `/register` (no `?workshop=` param), hover each of the 8 rows, confirm the correct benefit copy appears.
- Load `/register?workshop=brand-identity`, confirm no tooltips appear on the walk-outs list (Build branch untouched).
