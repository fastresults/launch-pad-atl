
## Goal

Produce a **multi-pass strategic audit** of the StartupLabs / Launch Pad home experience — every section of copy, every one of the 60+ startup ideas, the promise made to the visitor — and translate the whole system into a signature, ownable framework: **The Anderson Method™**. Deliverable is a 25–40 page report shipped as both a polished PDF and a markdown source-of-truth in the repo.

## Audience the report speaks to

Four founder archetypes, written to in this order:

1. **Aspiring first-time founder** — has an itch, no playbook.
2. **Plan-B seeker** — W-2 professional wanting a real off-ramp.
3. **Main Street / trades operator** — hands-on, local, physical work.
4. **Family / couple operator** — building a household enterprise.

Every framework, insight, and rewrite in the report gets stress-tested against those four lenses.

## Multi-pass audit methodology

**Pass 1 — Inventory.** Extract every user-facing string from the home page, framework component, video testimonials block, and the 60 idea entries (name, offer, ideal operator, why smart, first customers, startup cost, income range, stage hint, annual potential). Build a single source table.

**Pass 2 — Promise audit.** Score current hero, framework, and section copy against the four archetypes on: *permission* (do they see themselves?), *proof* (do they believe it?), *path* (do they know the next step?), *payoff* (do they feel the life change?).

**Pass 3 — Idea economics.** Aggregate the 60 ideas by category, startup cost band, annual income band, time-to-first-dollar, and archetype fit. Surface the real distribution of the offer — which archetypes are over/under-served, where the strongest ROI lives, and which ideas deserve to be flagship examples.

**Pass 4 — Life-change frame.** For each archetype, write the *before/after* narrative the site should be selling — not features, but the transformation. Tie specific ideas from the 60 to each transformation as proof.

**Pass 5 — Method synthesis.** Reverse-engineer the implicit playbook already inside the framework, the stages, and the 60 ideas into **The Anderson Method™** — a named, ownable, teachable seven-part system with a signature diagram, principles, and vocabulary.

**Pass 6 — Messaging rewrite kit.** Every audit finding becomes a concrete rewrite: new hero, new subheads per section, new CTA ladder, new archetype-specific entry paths, and language patterns that reinforce the Method.

**Pass 7 — Rollout playbook.** Prioritized changes with effort/impact, plus a 30/60/90 rollout for the site, sales page, emails, and social so the Method becomes the through-line everywhere.

## The Anderson Method™ — working framework

Seven stages, each an ownable verb + a principle drawn straight from the existing product:

1. **Anchor** — pick the archetype and the honest starting point.
2. **Name** — commit to a concrete idea from the 60, no drift.
3. **Design** — shape the offer, pricing, and first-customer list.
4. **Equip** — the minimum toolkit (LLC, permits, gear, brand).
5. **Reach** — the exact first-30-days customer acquisition play.
6. **Ship** — get the first paying customer in weeks, not quarters.
7. **Scale** — the honest ladder from side income to life change.

*(Acronym check: A-N-D-E-R-S-S doesn't spell cleanly, so we keep the name front and center and treat the seven stages as the "Anderson Seven." Final naming locked in the report.)*

Every stage in the report gets: definition, why it matters, how the site already delivers it, the 2–3 signature ideas that best exemplify it, and the messaging patterns to use.

## Report structure (25–40 pages)

1. Executive summary (1 pg)
2. The audience we're actually talking to — 4 archetypes with sharp portraits (3 pg)
3. Current-state audit of the home page (5 pg) — section-by-section teardown with pull-quotes and scorecards
4. The 60 ideas, decoded — economics, coverage map, hero picks (5 pg with tables)
5. The transformation we're really selling — before/after per archetype (4 pg)
6. Introducing The Anderson Method™ — origin story, seven stages, diagram (5 pg)
7. The 60 ideas mapped to the Method (3 pg matrix)
8. Messaging rewrite kit — hero, sections, CTAs, emails, social (4 pg)
9. Rollout playbook — 30/60/90 with owners (2 pg)
10. Appendix — full extracted copy inventory + full idea table (as many pages as needed)

## Deliverables

- **`/mnt/documents/anderson-method-audit.pdf`** — designed report using the site's dark-navy + primary-purple palette, real headings, callout boxes, category and archetype tables, the seven-stage diagram, and pull-quotes from actual site copy. Built with `reportlab` (Platypus) so tables and diagrams render cleanly, then visually QA'd page-by-page before delivery.
- **`.lovable/anderson-method-audit.md`** — the same content in markdown as the editable source of truth for future revisions.
- **`<presentation-artifact>`** tag surfacing the PDF for immediate download.

No changes to the live site in this pass — this is a strategy document. A follow-up plan can turn the messaging rewrite kit into actual copy changes once you approve the Method.

## Technical notes

- Source extraction: `src/routes/index.tsx`, `src/components/home/HomeFramework.tsx`, `src/components/home/HomeBusinessIdeasScroller.tsx`, `src/components/home/VideoTestimonials.tsx`, `src/lib/business-ideas.ts`.
- PDF built with `reportlab` Platypus; no unicode subscripts, dual-width tables in DXA-equivalents, header/footer with page numbers, project palette (`#0F0A1F` bg accents, `#a78bfa`/primary purple for callouts, off-white body).
- Every page of the PDF converted to JPG and inspected before hand-off; any layout issues fixed and re-rendered.
- Markdown lives in `.lovable/` so it's out of the app bundle but tracked in the repo.

## Out of scope (this pass)

- Editing home page copy, hero, or framework components.
- Building a public `/method` marketing route.
- SEO scans, ad copy, or funnel/analytics wiring — noted as follow-ups in the rollout section.
