# Heavy lifting, reframed as building on the foundation

Right now the eight major moves read as if the work starts from zero. The founder already paid for and received the foundation: brief, offer thinking, brand mark and system, collateral, website PRD and copy direction, campaign arc, and the operating documents. The comparison block should credit that plainly, then show that what remains is configuring, filing, connecting, elevating and operating it — not rebuilding it.

## What changes

Each of the eight moves gets a third element: **what you already have from the build**. The "you do it" and "we do it" lines are rewritten so neither implies the artifact is being created again.

Old framing (implies new work) → new framing (advances the foundation):

| Move | Already yours from the build | What remains |
|---|---|---|
| Entity, EIN, legal base | Structure recommendation and the terms your brief assumes | File it, get the EIN, put the agreement and contracts in force |
| Banking, books, QuickBooks | Your model, pricing and revenue lines | Open accounts, configure QuickBooks to those lines, test invoicing |
| Offer and pricing | The priced offer and positioning | Pressure-test it on live calls, tighten objection language, lock terms |
| CRM, A2P, automation | Messaging, sequences and pipeline logic already written | Build the sub-account, load the copy, get A2P approved, test with real records |
| Lists, leads, funnels | Lead magnet concept, capture copy, nurture arc | Build and connect them, wire tracking, prove the path converts |
| Website | The PRD, art direction and written copy | Build, launch on the domain, connect analytics and search |
| Brand system | Mark, palette, type, voice, collateral set | Grade it, write the art direction, refine and produce print-grade |
| Campaign creative | Eight-week arc and the foundation poster set | Commission real imagery, rebuild the system to the direction, run it |

## Copy rules applied

- No "we create/build your brand, offer, copy" where the foundation already delivered it. Use configure, file, connect, pressure-test, produce, elevate, operate.
- "You do it" describes the founder carrying the remaining work alone — learning the tool, doing the filing, holding the standard — never that they'd have to invent the asset.
- Section subhead changes from "These are the same milestones either way" to language that names the foundation as the starting line.

## Technical detail

Single file: `src/components/ops/HeavyLifting.tsx`. The `Cluster` type gains a `have` field (what the build already delivered); each of the eight entries gets rewritten `label`, `have`, `you`, `we`. The card renders `have` as a quiet line above the two-column comparison. No data, matching logic, or count behaviour changes.
