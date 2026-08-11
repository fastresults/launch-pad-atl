# Enrich the Operating Runway: creative sign-off, CRM depth, lists, funnels

The runway today covers legal, money, domain, site, delivery, and rhythm. Two tracks are thin:

1. **Creative finalization** — the showcase hands over AI-generated brand work, but nothing in the runway says "approve the mark, export print files, apply it everywhere."
2. **Demand infrastructure** — "Stand up the CRM" and "Queue the content calendar" are single lines. There is no list building, lead magnet, funnel, nurture, forms, scoring, or attribution.

This plan adds those as new tasks inside the existing phases. Nothing is renamed or removed, so any founder already working a runway keeps their progress (seeding upserts on the task key and only inserts what's missing).

## New work, in order

### Creative finalization (Brand — Days 7 and 11)
- Approve the final logo lockup and clear-space rules (primary, stacked, and one-color versions signed off).
- Export the print + digital asset pack (SVG, PNG, favicon, OG image, business card and letterhead print files at bleed).
- Lock the color and type system — hex, Pantone/CMYK equivalents, and the licensed font files or web-font embed.
- Publish the brand style system to the team (the per-venture style guide export, shared with anyone who touches a surface).
- Apply the identity to every live surface (site, email signature, invoice, proposal, social profiles) — a one-pass consistency sweep.
- Commission or select real photography/imagery to replace placeholders where the brand needs human proof.

### CRM depth (Strategy/Operations — Days 3 and 12)
- Configure CRM fields and required data (source, segment, deal value, next step, close date).
- Define lead sources and tag every record so channel performance is readable later.
- Segment the list into working lists (ICP tiers, warm vs. cold, industry, geography).
- Set the lead-scoring rule — the simple, written definition of a qualified lead.
- Turn on task and reminder automation so no deal sits untouched past a set number of days.
- Build the reporting view: pipeline by stage, by source, and by owner.

### Lists, funnels, and nurture (Marketing — Days 10, 13, and Day 15+)
- Build the lead magnet (the thing worth an email address) and its delivery automation.
- Publish the capture funnel: landing page → form → thank-you → delivery, all tracked.
- Wire forms into the CRM so a submission creates a record, not an inbox item.
- Write the welcome/nurture sequence (5 emails) and set it running for new subscribers.
- Set the UTM and attribution convention so every link reports back to a source.
- Stand up the retargeting audience from site and list traffic.
- Define the list-hygiene rhythm (bounces, unsubscribes, re-engagement) at Day 31+.

## Dashboard changes
- Add a **Creative** filter alongside the existing category dots so brand sign-off is visible as its own thread.
- Each new task links to the showcase assets that already exist for it (brand kit, style system, content calendar, PRD), so clicking a task opens the artifact rather than a blank page.
- Phase progress counts update automatically from the catalog — no separate math.

## Technical notes
- All additions go into `supabase/functions/_shared/ops-runway.ts` as new `subs` entries on existing days plus new `POST_LAUNCH` rows; task keys are new slugs so `buildOpsCatalog` grows without touching existing rows.
- Seeding in `venture-ops` already upserts on `(snapshot_id, task_key)` — re-listing an existing runway backfills the new tasks on next load. Verify that path explicitly for a venture already seeded (CarveWorks) rather than assuming it.
- `OpsCategory` gains `"Creative"`; `src/lib/ops-runway.ts` needs the matching label + dot color, and `OpsDashboard.tsx` the filter chip.
- Redeploy `venture-ops` after the catalog change.

Roughly 30 new tasks, bringing the runway from 76 to about 106 steps.
