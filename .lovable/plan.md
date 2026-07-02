## Add "Edit headline" entry point to the asset preview modal

Right now users can only reach the headline text control by clicking Regenerate and scrolling through the dialog. This plan adds a direct entry point from the preview modal.

### What changes

**1. New "Headline" row in the preview modal right rail** (`AssetPreviewDialog.tsx`)

Placed directly under the **Palette** section, above the action buttons:

```text
┌─────────────────────────────┐
│ Palette                     │
│ [ swatches... ]             │
├─────────────────────────────┤
│ Headline on image           │
│ "An AI-native, strategy…"   │
│ [ ✎ Edit headline ]         │
├─────────────────────────────┤
│ Model  · google/gemini-…    │
└─────────────────────────────┘
```

Behavior:
- Always renders (even when `last_headline` is null) so the affordance is visible on legacy assets.
- Shows the stored `last_headline` when present. When null, shows *"Auto-derived from your venture"* as a hint.
- When `last_headline === ""` (explicitly suppressed), shows *"No text on image"* with the pencil affordance to re-enable.
- Truncates to two lines with ellipsis; full text on hover title.
- **Edit headline** button — a small ghost button with a pencil icon that fires a new `onEditHeadline` callback.

**2. Wire the button to the existing Regenerate dialog** (`SocialAutopilot.tsx`)

- `onEditHeadline` opens the same `RegenerateAssetDialog` already used by the ↻ overlay, but passes a new `focusSection: "headline"` prop.
- The preview modal stays mounted underneath (busy overlay behavior we already ship).

**3. Auto-focus the headline section when opened via Edit headline** (`RegenerateAssetDialog.tsx`)

- New optional prop `focusSection?: "headline" | "palette" | "feedback"`.
- When `focusSection === "headline"`:
  - Scroll the headline block into view on mount (`useRef` + `scrollIntoView({ block: "start" })`).
  - Add a temporary ring highlight (`ring-2 ring-primary` for ~1.2s) so the section is visually obvious.
  - If `currentHeadline` is present, default the mode to **Custom text** with the field pre-focused and text selected, so the user can immediately type a replacement.
  - Otherwise default to **Custom text** with an empty field focused.

**4. Suggested-headline fetch for legacy assets**

The sidebar's fallback preview needs *something* to show when `last_headline` is null. Two-tier resolution:
- If `last_headline` exists → show it verbatim.
- Otherwise → show a client-side derivation: `snap.identity?.tagline ?? snap.name` (same fallback chain the Edge Function uses). No new network call; this data is already in the venture snapshot query.

### Files touched

- `src/components/hub/social/AssetPreviewDialog.tsx` — add Headline row + Edit button + `onEditHeadline` prop.
- `src/components/hub/social/RegenerateAssetDialog.tsx` — accept `focusSection`, scroll + highlight + prefocus custom input.
- `src/components/hub/social/SocialAutopilot.tsx` — pass `onEditHeadline` (both preview instances at ~L687 style-preview and ~L1161 kit-asset), thread `focusSection: "headline"` into `regenTarget` state, forward derived fallback headline into `AssetPreviewDialog` as `lastHeadline` when the row is null.

### Non-goals

- No changes to Edge Functions or DB.
- No backfill of `last_headline` for old rows (they will use the client-side derivation for display; next regeneration will persist the real value).
- No changes to the ↻ tile overlay flow — it continues to open the dialog without a focused section.

### Acceptance

- On any asset preview modal, a **Headline on image** row is visible in the right rail.
- Clicking **Edit headline** opens the Regenerate dialog with the headline section scrolled into view, highlighted, and the Custom text input focused with existing text selected.
- Submitting from that state regenerates the asset with the new headline and the preview modal updates in place (existing busy-overlay behavior).
- Legacy assets (with `last_headline = null`) show a sensible derived preview instead of a blank row.