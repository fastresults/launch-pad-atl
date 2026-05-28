## Goal
Tighten the `/schedule` page so the day reads as a single confident arc: stronger hero hierarchy, a scannable rail of "where you are in the day," and denser, more disciplined session cards. Conservative — no new pages, no new colors, no animations beyond what already exists.

## Diagnosis (what's hurting impact today)

1. **Hero is text-only and timid.** Date pill, headline, paragraph — then a long scroll with no orienting summary. The reader doesn't know how big a commitment they're previewing.
2. **No "at-a-glance" map of the day.** The timeline forces sequential reading; a prospective attendee can't jump-scan the 7 stages + 2 breaks before committing to the deep read.
3. **Stage cards lean visually flat.** Time, duration, "Stage N" pill, title, summary all sit on the same baseline row. The "YOU WALK OUT WITH" promise from the home page is missing here — the highest-converting line is hidden on the wrong page.
4. **Inner task block is dense but unstructured.** Numbered list works, but `tool` chip + `Take home` callout + "Also covered" pills stack as four different visual systems inside one card.
5. **Bottom CTA is a lone button.** No reinforcement of the outcome right where the decision happens.

## Edits (all in `src/routes/schedule.tsx` — no data shape changes)

### 1. Hero — add a 3-stat ribbon under the paragraph
Below the existing paragraph, add a single row of three stat tiles (border + muted bg, no gradients):
- `7 hrs` · working time
- `7 stages` · idea → launch
- `9 deliverables` · in hand by 4:30
Border-top divider, simple `grid-cols-3` on md+, stacked on mobile. Reinforces scope without redesigning the hero.

### 2. New "Day at a glance" rail (between hero and timeline)
A single horizontal strip listing the 9 sessions in order (`Check-in → S1 → S2 → S3 → Lunch → S4 → S5 → Coffee → S6 → S7`), each item showing `time` over `short label`. Items are anchor links to the matching `#stage-N` below. Renders as a `flex flex-wrap` row on desktop, horizontal scroll on mobile (`overflow-x-auto snap-x`). Uses existing tokens (`border-white/10`, `text-muted-foreground`, `bg-hero-gradient` dot for stages, `bg-white/20` dot for breaks). Gives the prospect a one-screen map before they commit to reading.

### 3. Timeline rail — minor polish, no restructure
- Change `space-y-4` → `space-y-6` so session cards breathe.
- Promote the rail color from `border-white/10` to `border-white/15` for stronger spine continuity.
- Increase stage dots from `size-4` → `size-5` and add a faint ring (`ring-2 ring-background`) so they read as real waypoints over the line.

### 4. Session card header — clearer hierarchy
Re-stack the meta row so time is the anchor:
```
[ 8:30 AM ]  ── thin divider ──  60 min   · Stage 1 pill (right-aligned on md)
Stage title (text-2xl, was text-xl)
1-line summary
```
- Bump title to `text-2xl md:text-3xl` so the stage name carries the card.
- Move the `Stage N` pill to the right side of the meta row (justify-between) so it acts as a tab marker, not competing with the time.
- Keep all existing classes, colors, and the gradient pill.

### 5. Add a "You walk out with" strip inside each stage card
Above the "3 essential tasks" block, add a single-line band:
```
YOU WALK OUT WITH   ·   {stage.takeHome}
```
Styling: `rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3`, micro-eyebrow in `text-[10px] uppercase tracking-[0.22em] text-muted-foreground`, then the take-home in `text-sm text-foreground/90`. Pulls the home page's strongest line onto the deep-read page exactly when the reader is considering the hour.

### 6. Tasks block — quiet the visual noise
- The `tool` chip and the "Take home" follow-up box currently stack vertically and read as two separate systems. Move the `tool` chip to sit **inline at the end of the deliverable row** (so: `✓ deliverable line  ·  [Notion]`), freeing vertical rhythm.
- Reduce the dashed border on the follow-up box to a left-accent bar (`border-l-2 border-white/15`, no full border, same italic copy) — calmer, still distinct.
- Replace the "Also covered" header underline (`border-t border-white/10 pt-4`) with `mt-4` only; the pills already read as a separate group.

### 7. Break cards — match the rhythm
- Bump padding `p-5 → p-6`, add `gap-4`, and right-align a small `time` pill so breaks read as deliberate beats, not afterthoughts.

### 8. Footer CTA block — replace the lone button
Replace the single centered button with a compact 3-line outcome reminder + button on a bordered tile:
```
Headline: One day. One door. Twenty seats.
Subline:  Idea in at 8 AM. Filing-ready business + signed 90-day plan out at 4:30 PM.
[ Reserve your seat → ]
```
Uses existing `rounded-2xl border border-white/10 bg-card p-8 text-center` pattern from elsewhere on the site. No new tokens.

## What stays the same
- Route file location, data shape (`SCHEDULE`, `STAGES`, `EVENT`), all copy from `curriculum-data.ts`, all icons, all existing color tokens. No edits to `src/lib/*`.
- `#stage-N` anchors, smooth-scroll behavior, FlowStrip link targets from `/`.
- No new dependencies, no new components, no animation libraries.

## Verification
- Reload `/schedule`: hero shows 3 stat tiles; "Day at a glance" rail under it; clicking a rail item scrolls to that session.
- Each of the 7 stage cards displays the `YOU WALK OUT WITH` strip with the correct take-home from `curriculum-data.ts`.
- Mobile (≤640): stat ribbon stacks, rail scrolls horizontally with snap, cards remain full-width.
- Coming from `/` → flow strip card click still lands on the correct `#stage-N` mid-card.
