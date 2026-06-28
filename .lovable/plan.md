## Make Concept Studio a distinct AI studio (not a sub-section of "Lock your concept")

**Problem.** Inside the Lock review step, the Concept Studio renders as a plain `bg-card` block with the same chrome as every other card. It looks like part of the lock screen. Its sibling, the Epiphany Engine, gets a bold amber-gradient treatment that clearly signals "separate AI tool." Concept Studio deserves equal weight.

**Goal.** Two visually distinct, paired AI studios stacked above the lock card:
1. **AI Studio · 01 — Concept Studio** (primary/blue tone)
2. **AI Studio · 02 — Epiphany Engine** (existing amber tone)
…then the lock & continue card.

---

### Changes

**1. `src/components/hub/ConceptStudio.tsx` — promote Step 1**

Replace the flat wrapper around Concept Studio with a branded studio container mirroring Epiphany's gravitas in a different hue:
- Wrapper: `rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]`
- Add a tracked uppercase kicker `AI STUDIO · 01` in primary color above the title.
- Title to `text-lg font-semibold`; Sparkles icon inside a `h-8 w-8 rounded-full bg-primary/15` chip.
- Recolor the Refining/Locked badge in primary tones.
- Promote "Draft from research" to a filled primary button so the entry CTA is unmistakable.
- Wrap the summary + VP fields in an inner `rounded-xl bg-background/40 p-4` panel so the studio reads as a framed workspace.

**2. Insert a "studios intro" band between the page header and Step 1**

Above the Concept Studio card, render a divider band matching the existing "Optional deep pass" style:

```text
──────  TWO AI STUDIOS BEFORE YOU LOCK  ──────
   Sharpen the wording, then optionally stress-test the idea.
```

Gives the eye a clean hand-off from "Lock your concept" header into the AI tooling.

**3. Pair the studios visually**

Tighten the visual rhyme so Concept Studio and Epiphany read as siblings:
- Epiphany kicker → `AI STUDIO · 02` (amber), mirroring `AI STUDIO · 01` (primary).
- Match icon-chip pattern: Zap in `h-8 w-8 rounded-full bg-status-warning/15`.
- Keep the existing "Optional deep pass" divider between them.

**4. Re-tone the page header in `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (+ `src/lib/reviewCopy.ts`)**

Soften the page-level "Lock your concept / One last look…" so it doesn't compete with the studios that follow. Add a single helper line: *"Use the two studios below to refine, then lock."* This reframes the screen as "studios → lock" instead of "lock screen with stuff inside."

---

### Technical notes

- All color via existing semantic tokens (`--primary`, `--status-warning`, `--card`, `--background`). No hardcoded colors; light/dark preserved.
- Pure presentation. No logic, mutations, Edge Function, or DB changes.
- No changes to Step 2 (Epiphany) behavior or the lock/unlock flow.