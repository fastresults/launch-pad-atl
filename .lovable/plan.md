# Venture Workspace — Minimalist Guided Pass

## What's cluttered (audit from the captured screen)

The page currently stacks **five hero-weight blocks** in the first fold, several of which say the same thing twice:

1. **`01 · NEXT ACTION` intro** (eyebrow + what + why + "How to use" pill)
2. **"Your startup kit is ready" banner** (green gradient, own CTA)
3. **"The Big Picture — Your Founder Roadmap" card** (purple gradient, own CTA + Regenerate)
4. **`02 · 14-DAY LAUNCH METHOD` intro** — followed immediately by the planner's own header **"14-DAY LAUNCH METHOD · Your day-by-day sprint"** (identical eyebrow, twice, back to back)
5. **`03 · AI TOOLKIT` intro** — followed immediately by the AI Stack panel's own header **"YOUR AI STACK · Turn your 14-day plan into an installable toolkit"** (again, duplicate)

Every SectionIntro also carries its own **"How to use"** pill in the same slot — four of them down the page. The `01 · Next action` intro contradicts reality once the kit is done (there *is* no next action; it's all generated). The result: a founder scrolls past four competing "start here" surfaces before reaching actual assets.

## Guiding principles for this pass

- **One hero, not five.** Only one block in the first fold gets the visual weight of a primary card.
- **Never title the same section twice.** SectionIntro OR the component's internal header — not both.
- **State-aware guidance.** What appears depends on progress: pre-generation shows "next action"; post-generation shows "your roadmap." They never both shout at once.
- **Guidance stays, chrome shrinks.** Keep the numbered orientation + "How to use" affordance, but make it a quiet rail — not a repeated banner.

## Plan

### 1. Collapse the SectionIntro chrome into an in-header line

Change `SectionIntro` from a full-width bordered block into a **single-line eyebrow row** with the "How to use" as a tiny icon-only info button on the far right. Remove the left border bar. Remove the "what/why" sub-copy from the section header itself — move the "why it matters" sentence into the "How to use" popover as its first line. This eliminates ~3 lines of vertical clutter per section and stops it from competing with the component title underneath.

New shape (one line, muted, above the real component):
`01 · NEXT ACTION ────────────────────────────  ⓘ`

The popover now reads: **Why this matters:** … · **How to use:** 1. …  2. …

### 2. Remove duplicate titles from the two planner components

- `LaunchPlanner14Day.tsx` (lines ~198–208): delete the internal `14-DAY LAUNCH METHOD` eyebrow + `Your day-by-day sprint` H2 + description paragraph. Keep only the progress pill on the right. The SectionIntro row above now provides the title.
- `AIStackPanel.tsx` (headers around lines ~130 and ~160): remove the internal `YOUR AI STACK` eyebrow + duplicate H3. Keep the body + CTA.

Rationale: the SectionIntro row IS the title. The component just renders content.

### 3. Merge the two victory banners into one adaptive hero

Today, once the kit is done, the page shows both **"Your startup kit is ready"** (green) AND **"Your Founder Roadmap"** (purple) as separate top-of-page cards. Merge into a **single state-aware hero**:

- **State A — not started / partial** (`completeCount < total`): show the current "Generate next / Generate all" hero. No roadmap card yet.
- **State B — kit complete** (`heroDone === true`): the hero itself becomes the roadmap card — headline "Your startup kit is ready · 63 assets", primary CTA "**Open Founder Roadmap**", secondary "View first asset", tertiary ghost "Regenerate all". The standalone `FounderRoadmapCard` is not rendered separately.

This removes one full hero-card from the first fold and eliminates the "which purple button do I click?" ambiguity.

### 4. Drop the `01 · Next action` SectionIntro entirely

Its content ("the single most important thing to generate right now") is redundant with the hero's headline and CTA. The hero already IS the next action. Keeping the intro adds noise without new information.

Renumber remaining sections: **01 · 14-Day Launch Method**, **02 · AI Toolkit**, **03 · Your asset library**.

### 5. Quiet the asset-library preamble

Above the accordion stack the page currently shows:
- SectionIntro "04 · Your asset library" (with what/why/how-to)
- an H3 "Your assets" + long descriptive paragraph
- Expand-all / Collapse-all buttons
- A category-progress chip strip (6 chips)

Collapse to:
- One SectionIntro row: `03 · YOUR ASSET LIBRARY  ⓘ` with Expand/Collapse on the right
- The category-progress chip strip stays (it's real progress data, not chrome)
- Delete the H3 "Your assets" and its paragraph — the numbered eyebrow already labels it

### 6. Move the persistent "This page writes your full startup kit…" helper strip

That amber banner at the very bottom repeats what the hero already says. Remove it (it's already dismissible; make it default-hidden and only surface via the "?" chip in the page header for users who explicitly ask for the tour).

### 7. Welcome strip refinement

Keep `DashboardWelcomeStrip` but auto-hide it once `completeCount > 0` (already done) AND once the user has been on the page more than one session. On repeat visits with 0 progress, show a slimmer one-line version, not the full padded card.

## Files to change

- **Edit:** `src/components/hub/SectionIntro.tsx` — collapse to single-line row + icon-only info popover; move "why" into popover.
- **Edit:** `src/components/hub/LaunchPlanner14Day.tsx` — delete internal eyebrow/title/description block (~lines 198–208), keep progress pill.
- **Edit:** `src/components/hub/AIStackPanel.tsx` — delete internal eyebrow/title in both `heroDone`/`!stackDoc` branches.
- **Edit:** `src/components/hub/FounderRoadmapCard.tsx` — no longer rendered standalone; extract its data (word count, generated date, quality score) into a helper so the hero can display them in State B.
- **Edit:** `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (`GenerateStep`):
  - Remove `<SectionIntro copy={HUB_DASHBOARD_INTROS.next_action} />` above the hero.
  - Remove separate `<FounderRoadmapCard />` render — fold into hero.
  - Renumber remaining SectionIntro copy 01→02→03.
  - Delete the "Your assets" H3 + paragraph; keep only the SectionIntro + Expand/Collapse row.
  - Remove the amber helper strip (or hide by default).
- **Edit:** `src/lib/hub-dashboard-copy.ts` — drop the `next_action` entry, renumber eyebrows, restructure copy so `why` is popover-only.

## Out of scope

- No changes to generation logic, edge functions, brand-kit gate, day-deck dialog, or the accordion internals.
- No color/typography changes — this is a structural/IA pass, not a visual restyle. The chosen palette and section colors stay.
- The category-progress chip strip and the per-section headers inside the accordion stay as they are.

## Verification

- Fresh venture (0 assets): first fold shows welcome strip → single "generate" hero → sprint planner (no duplicate title) → AI stack → asset library. That's it.
- Complete venture (63/63): first fold shows single hero card that IS the roadmap (green tone, Founder Roadmap as primary CTA). No separate purple roadmap card underneath.
- Each SectionIntro is a single quiet line, not a bordered block. Clicking ⓘ opens why + how-to.
- No two adjacent blocks carry the same eyebrow text.
