# Operationalize header: credit the foundation first

Right now the Operationalize header opens with "Turning the foundation into a running business," which reads as if the real work starts now. A founder scanning ~130 tasks can conclude the foundation they paid for was preamble. The header should state plainly what the foundation already produced, and frame this runway as the natural next phase that only exists because that work is done.

## What changes

**1. Header title and supporting copy (`OpsDashboard.tsx`)**

New framing, in this order:
- Small eyebrow above the title: "Phase 2 of 2 — Foundation complete."
- Title stays "Operationalize."
- Supporting line rewritten to credit the foundation and connect it forward, e.g.:
  "Your foundation is built — the offer, brand, site, campaign and operating assets are done and yours. Nothing here recreates it. This phase puts it into the world: filing, accounts, systems, and the first sales. Right now you're in {stage.when} — {stage.name}."

**2. A quiet "what the foundation delivered" line**

A single row of foundation artifacts under the header copy — offer and pricing, brand system, website direction and copy, campaign arc, operating assets — rendered as small muted chips with a check glyph, plus a short trailing note: "Already done. This runway builds on it." Purely presentational, no data.

**3. First-run walkthrough panel 1 (`OpsOnboarding.tsx`)**

Adjust the opening panel so it leads with the value of the foundation rather than "now you run it": name what it produced, then say the remaining work is execution — filing, connecting, selling — which no amount of strategy can do for them.

## Copy rules applied

- Never imply the runway rebuilds anything the foundation delivered — use put in force, connect, configure, launch, operate.
- No "plan / blueprint / deliverables" language for the foundation; name the real artifacts.
- "Startup," not "business," in user-facing copy; "assets," not "documents."

## Technical detail

Two files, presentation only: `src/components/ops/OpsDashboard.tsx` (header block, lines ~149–168, plus a new inline foundation chip row) and `src/components/ops/OpsOnboarding.tsx` (first PANELS entry). No changes to task data, delivery-mode logic, or backend.
