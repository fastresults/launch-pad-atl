## Goal
Two connected additions to the 14-day sprint panel:
1. Show **estimated time** on every asset row, split into "read" vs "do" based on its track, with a per-day total at the top.
2. Add a **Day Sprint Deck** — a per-day facilitator-style slide presentation, opened from the day panel, that walks the founder through that day's assets and how to execute them.

## Part 1 — Estimated hours

### Source of truth
`venture_document_types.estimated_minutes` already exists on every asset and is loaded into `typeByKey`. No DB change. No content backfill needed.

### Read vs Do classification
Derive from the existing track:
- Introduction, Education → **read** time (absorb / internalize)
- Tracking → **read + configure** (split 50/50)
- Action → **do** time (build / ship / deploy)

Helper in `src/lib/asset-tracks.ts`:
```ts
export function timeSplit(track: AssetTrack, minutes: number):
  { read: number; do: number } {
  switch (track) {
    case "Introduction":
    case "Education": return { read: minutes, do: 0 };
    case "Tracking":  return { read: Math.round(minutes/2), do: Math.ceil(minutes/2) };
    case "Action":    return { read: 0, do: minutes };
  }
}
export function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min/60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
```

### Row rendering (LaunchPlanner14Day)
Under the asset title/subtitle line, replace the current "Ready to open / Not started" line's tail with:
```
Ready to open · ⏱ 25m read
Not started · ⏱ 45m to build
```
- Icon: `Clock` from lucide.
- Suffix picks label from `timeSplit`: `Xm read`, `Xm to build`, or `Xm read + Ym build` for Tracking.
- Optional assets show their time in muted amber to match the Physical-products pill.

### Day summary (top of detail panel)
Replace the current `active.done/active.total assets ready today` line with a two-line meta strip:
```
5/6 ready today · ≈ 3h 20m focused work
Read 1h 40m · Build 1h 40m
```
Computed by summing `estimated_minutes` for `available` keys and running each through `timeSplit`. Optional (physical-only) assets are counted only when `isPhysical` — matches existing "optional" logic.

### Day tile (grid)
Add a small `⏱ 3h 20m` line under the `done/total` counter on each day tile (`text-[10px] text-muted-foreground`) so founders can eyeball the sprint load without opening a day. Skip on very tight grids if it clips — the tile currently has room.

### Framework category rows
The framework item card already renders `~{t.estimated_minutes} min`. Leave as-is (that surface is per-item, not per-day totals).

## Part 2 — Day Sprint Deck

A per-day presentation modeled on the existing Facilitator Deck (`DeckDialog` + `SlideLayout` + `ScaledSlide`), but driven dynamically from the day's plan + asset metadata — so we get 14 decks "for free" without hand-authoring 100+ slides.

### Entry point
In `LaunchPlanner14Day` day panel header, next to the sort toggle, add:
```
[▶ Open Day Deck]
```
Primary-styled button with `Presentation` icon. Opens the deck for `active.day`.

### New component: `src/components/hub/DaySprintDeckDialog.tsx`
Reuses the same visual chrome as `DeckDialog` (dark stage, top bar, side arrows, progress bar, thumbnail rail, ←/→/F/Esc keys, fullscreen). It differs only in that its `slides` array is built from a `LaunchDay` + `typeByKey` + track/time helpers, not from a static registry.

Signature:
```ts
type Props = {
  day: LaunchDay | null;
  typeByKey: Map<string, VentureDocumentType>;
  completedKeys: Set<string>;
  isPhysical: boolean;
  sourcingOnlyKeys?: Set<string>;
  onOpenChange: (open: boolean) => void;
  onJumpToAsset?: (key: string) => void; // closes deck + scrolls
};
```

### Slide sequence (dynamic per day)
1. **Cover** — `Day N · <Category>` kicker, `<theme>` as `slide-title-lg`, `<objective>` subtitle. Bottom-right badge: `≈ Xh Ym focused work`.
2. **Why today matters** — pull `objective` + a canned "why this day" line derived from `category`/`week` (map of 14 curated one-liners in `src/lib/launch-14day-guidance.ts`).
3. **What "done" looks like** — `doneWhen` rendered as a large statement with a `CheckCircle2` icon.
4. **The plan (overview)** — 2-column bento of assets grouped by track (Intro/Edu/Track/Action columns collapse to available tracks). Each card: track chip, asset name, `⏱ time`, one-line description from `type.description`.
5. **N asset slides** — one per available asset, in track order (Introduction → Education → Tracking → Action):
   - Kicker: `Asset K of N · <TRACK>`
   - Title: asset name
   - Left half: `type.description` + a short "How to complete this" body — a canned template keyed by track:
     - **Introduction**: "Read the generated asset end-to-end. Rewrite anything that doesn't sound like you. Save the final line as the version you'll repeat out loud this week."
     - **Education**: "Skim once for the whole. Re-read the section that maps to what you'll do next. Copy the 3 highest-leverage moves into your notes."
     - **Tracking**: "Set it up in the tool it lives in. Enter your first real row today. Add a check to your weekly cadence."
     - **Action**: "Block a focused session. Follow the checklist inside the asset. Ship the smallest working version — not the perfect one."
   - Right half: status pill (Ready to open / Not started / Writing / Optional–physical), `⏱ estimated time`, and a large `Open this asset ▸` button that calls `onJumpToAsset(key)`.
   - Optional (physical-only) assets get a subtle "Skip unless you're shipping a physical product" note when `!isPhysical`.
6. **Order of operations** — numbered vertical list of assets in the order to tackle them today (Intro → Edu → Track → Action). Small time chips beside each.
7. **Time budget** — big stat row: `Total ≈ Xh Ym`, `Read Ah Bm`, `Build Ah Bm`, `# assets`. Under it: a suggested schedule for a working day (curated per day in the guidance file, or a generic template: "Morning: read Intro + Edu. Midday: configure Tracking. Afternoon: ship Action.").
8. **Common pitfalls** — 3 bullets from the guidance file per day (curated). Falls back to a generic 3-pitfall list if the day isn't in the map yet.
9. **Do this next** — CTA slide: primary button `Start with <first-not-complete asset>` that closes the deck and jumps to that asset. Secondary: `Close deck`.

Total: ~7 fixed + 2–6 dynamic asset slides = 9–15 slides per day.

### New data file: `src/lib/launch-14day-guidance.ts`
Adds per-day guidance the deck reads:
```ts
export type DayGuidance = {
  why: string;               // one paragraph, "why today matters"
  suggestedSchedule: string; // 1–2 sentences
  pitfalls: string[];        // 3 items
};
export const DAY_GUIDANCE: Record<number, DayGuidance> = {
  1: { ... },
  ...
  14: { ... },
};
```
Curated, short, in the voice already used by `doneWhen`/`objective`. This is the only real writing task in the whole feature.

### Slide implementation
- Reuse `SlideLayout` for consistent chrome (kicker, page label, dark/light variant). Use `variant="dark"` for cover and CTA, default light for the rest.
- Use the semantic slide typography classes (`slide-title`, `slide-subtitle`, `slide-body-lg`, `slide-kicker`, `slide-chrome`) already defined in `src/styles.css`.
- Track chips reuse `TrackChip` from `src/components/hub/TrackChip.tsx`.
- No `SlotText`/`SlotImage` overrides — these are ephemeral, per-venture decks, not the editable stage decks.

### Deck dialog chrome
Rather than fork `DeckDialog`, extract the chrome into `<DeckShell slides={...} title="Day N — Theme" open onOpenChange={...}>` (small refactor of `DeckDialog.tsx`) and have both the stage decks and the day decks render through it:
- `DeckDialog` becomes `DeckShell` + a thin wrapper that resolves `slug → slides` and loads overrides.
- `DaySprintDeckDialog` builds its slides array in-memory and passes to `DeckShell`. No override fetching.

### Wiring
In `hub.$snapshotId.tsx`:
- Add `openDayDeckDay: number | null` state.
- Pass `onOpenDayDeck={(day) => setOpenDayDeckDay(day)}` prop into `LaunchPlanner14Day`.
- Render `<DaySprintDeckDialog day={activeDay} typeByKey={...} completedKeys={...} isPhysical={...} onOpenChange={...} onJumpToAsset={(k) => { setOpenDayDeckDay(null); scrollToDoc(k); }} />`.

## Files touched
- **New:** `src/lib/launch-14day-guidance.ts` — per-day guidance content (14 entries).
- **New:** `src/components/hub/DaySprintDeckDialog.tsx` — dynamic deck for a single day.
- **Edit:** `src/components/workshop-slides/DeckDialog.tsx` — extract chrome into `DeckShell` (or export a reusable inner component).
- **Edit:** `src/lib/asset-tracks.ts` — add `timeSplit` + `formatDuration` helpers.
- **Edit:** `src/components/hub/LaunchPlanner14Day.tsx` — time on rows, day-summary meta, day-tile time chip, "Open Day Deck" button, wire callback.
- **Edit:** `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — mount `DaySprintDeckDialog`, wire jump-to-asset.

## Verification
- Day 6 panel shows `6/6 ready · ≈ 3h 15m focused work · Read 1h 20m · Build 1h 55m` and each row shows a `⏱` chip.
- Each grid tile shows a `⏱` sub-line.
- Click `Open Day Deck` on Day 3 → deck opens with cover slide "Day 3 · Strategy — Name your buyers, load the CRM"; arrow keys navigate; asset slides render Customer Personas / First-50 Warm List / CRM Pipeline Starter each with their track, time, and "Open this asset ▸" CTA.
- Clicking `Open this asset ▸` in the deck closes the dialog and scrolls to the matching asset card below.
- `Esc` and `F` behave as they do in the existing facilitator deck.
- `bunx tsgo --noEmit` clean.

## Open question (optional)
I've defaulted the read/do split by track. If you'd rather have a real per-asset `read_minutes` / `do_minutes` (DB migration + backfill on `venture_document_types`), say so and I'll swap Part 1 to use those columns instead. Track-derived is faster to ship and easy to override later.
