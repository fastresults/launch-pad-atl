## Goal

Restructure the homepage framework section so its categories and deliverables are a **1:1 match with the live `venture_document_types` table** that powers the founder dashboard / Founders Hub. The database is the source of truth; the homepage reflects it exactly.

## Source of truth (live from `venture_document_types`, `active = true`, ordered by `sort_order`)

**8 categories · 34 deliverables**

| # | Category | Deliverables |
|---|---|---|
| 01 | **Foundation** (4) | Executive Summary · Vision & Mission · Problem / Solution Brief · Value Proposition |
| 02 | **Strategy** (5) | Market Analysis · Customer Personas · Competitive Positioning · Go-to-Market Plan · Brand & Messaging |
| 03 | **Operations** (4) | Product Roadmap · Operating Plan · Sales Playbook · Marketing Plan |
| 04 | **Finance** (5) | Financial Model · Unit Economics · Funding Strategy · Budget & Pro Forma · Pitch Deck Outline |
| 05 | **Governance** (3) | Legal Structure Brief · Risk Register · Board & Governance Plan |
| 06 | **Brand** (5) | Brand Strategy Framework · Brand Messaging House · Visual Identity Brief · Brand Voice & Tone Guide · Brand Guidelines Book |
| 07 | **Marketing** (1) | Website PRD (AI-builder prompt) |
| 08 | **Social & Content** (7) | Social Media Audit & Setup · Content Strategy & Pillars · 90-Day Content Calendar · Launch Content Kit · Community Engagement Playbook · Influencer & Partnership Brief · Paid Ads Starter Pack |

The current homepage shows 3 hand-written stages with 20 made-up titles — that's the mismatch we're fixing.

## One open question to flag

**Category "Marketing" has only Website PRD** in the database. On the homepage it will look thin as a standalone block. Two clean options — I'll proceed with **A** unless you say otherwise:

- **A (default)** — Render exactly as DB says: 8 sections, with Marketing as a 1-item section. Pure 1:1.
- **B** — Merge Website PRD into the "Brand" or "Social & Content" block on the homepage only (DB unchanged). Looks tidier but is no longer a true 1:1.

## Single source-of-truth change

Rewrite `FRAMEWORK_STAGES` in `src/lib/framework-deliverables.ts` to 8 categories, 34 deliverables, in `sort_order`. Keep the existing shape (`number`, `name`, `intro`, `items[]`) so the homepage and register page render automatically.

Deliverable card labels = the **exact `name` from the DB**, so a founder sees the identical wording on the marketing site and inside their hub.

### Per-category intros (concise, benefit-led — content only, not structure)

- **Foundation** — "The bedrock every defensible startup is built on."
- **Strategy** — "How you win — and how you compound the lead."
- **Operations** — "What you build, sell, and ship — week after week."
- **Finance** — "The numbers investors, banks, and you can trust."
- **Governance** — "The legal and risk scaffolding that keeps you bankable."
- **Brand** — "An identity worth premium pricing — system, not stickers."
- **Marketing** — "The AI-builder prompt that ships your site in a weekend."
- **Social & Content** — "The distribution engine that earns attention on repeat."

### Icon mapping (lucide-react)

Foundation → FileText · Eye · AlertCircle · Sparkles
Strategy → BarChart3 · Users · Crosshair · Rocket · MessageSquare
Operations → Map · Settings · Handshake · Megaphone
Finance → LineChart · Calculator · Banknote · ClipboardList · Presentation
Governance → Scale · ShieldAlert · Landmark
Brand → Compass · MessageCircle · Palette · Mic · BookOpen
Marketing → Globe
Social & Content → Share2 · Layers · CalendarDays · PartyPopper · Heart · Star · Megaphone (or Target)

(Verified against `lucide-react` at edit time; substituted 1:1 if any are missing.)

## Copy fixes downstream

`src/components/home/HomeFramework.tsx`:

- Line 135 — `"{TOTAL_DELIVERABLES} deliverables across three stages …"` → `"{TOTAL_DELIVERABLES} deliverables across eight categories — each one built live for your startup, never pulled from a framework. Yours to keep for {WORKSHOP_PRICE_LABEL}."` (`TOTAL_DELIVERABLES` will compute to **34** automatically.)
- Line 180 — `"All ${TOTAL_DELIVERABLES} strategy deliverables — foundation, strategy, and launch"` → `"All ${TOTAL_DELIVERABLES} deliverables — Foundation, Strategy, Operations, Finance, Governance, Brand, Marketing, and Social & Content"`.
- Any other "three stages" / "20 deliverables" copy in this file: swap to the new wording. Section heading stays.

`src/components/register/RegisterFramework.tsx`:

- Already iterates `FRAMEWORK_STAGES` — new categories render automatically.
- Line 238 — `"20 deliverables total · built live with Adam · yours to keep"` → `"{TOTAL_DELIVERABLES} deliverables total · built live with Adam · yours to keep"`.

## What is NOT changing

- The DB (`venture_document_types`), edge functions, document generators, dashboard, Founders Hub — all untouched.
- Hero, "why first" reasons, Build Layer, pricing, CTAs, sticky bar, registration form — untouched.
- Visual styling of the framework cards — only contents change. (8 numbered blocks with 4/5/4/5/3/5/1/7 cards in DB order.)

## Verification after edit

1. `TOTAL_DELIVERABLES` evaluates to **34**.
2. Home `/` framework section renders **8 numbered blocks (01–08)** with card counts **4 / 5 / 4 / 5 / 3 / 5 / 1 / 7**, titles matching the DB `name` values verbatim.
3. Register page `/register` left-column pillar list renders the same 8 categories.
4. `grep -n "three stages\|20 deliverables\|foundation, strategy, and launch"` returns zero hits in `src/`.

## Files touched

- `src/lib/framework-deliverables.ts` (rewrite `FRAMEWORK_STAGES`, update icon imports)
- `src/components/home/HomeFramework.tsx` (two copy lines)
- `src/components/register/RegisterFramework.tsx` (one copy line)
- No DB or backend changes.
