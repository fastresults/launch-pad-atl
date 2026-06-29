# Smarter Brand Palette Rules

Today the wizard can land on palettes where `bg` and `fg` are both dark (or both light), which breaks readability the moment downstream generators (Website PRD, social creatives) render text on surfaces. We'll bake explicit color-role rules + automatic repair into both Brand Wizard tracks.

## Goals
- Guarantee every saved palette is usable for web + social out of the box.
- Assign each color a **semantic role**, not just a name.
- Auto-detect and auto-correct bad pairings instead of letting the user ship them.
- Pass authoritative, role-tagged tokens to downstream prompts.

## 1. Define a canonical palette role schema
Replace the loose `{ bg, fg, primary, accent, ... }` shape with a versioned schema stored on `venture_brand_kits.palette`:

```
{
  version: 2,
  mode: "light" | "dark",
  roles: {
    background:        { hex, role: "surface",          contrastRef: "text" },
    surface_alt:       { hex, role: "surface-elevated" },
    text:              { hex, role: "body-text" },
    text_muted:        { hex },
    primary:           { hex, onPrimary: hex },   // button bg + legible label
    secondary:         { hex, onSecondary: hex },
    accent:            { hex, onAccent: hex },
    border:            { hex },
    success/warn/error:{ hex }
  },
  source: "extracted" | "generated" | "user"
}
```
Every role carries the hex it must be legible against, so the website + social generators never have to guess.

## 2. Hard contrast + harmony rules (the "smarter rules")
Run these in a new `validatePalette()` util used by both tracks:

1. **Mode lock** – pick `light` or `dark` from the chosen `background`. `text` must be on the opposite end of the L* axis.
2. **WCAG gates**
   - body text vs background ≥ **4.5:1**
   - large text / UI vs surface ≥ **3:1**
   - `onPrimary` vs `primary` ≥ **4.5:1** (same for secondary/accent)
3. **No same-tone bg/fg** – reject pairs where both lie in the same lightness band (e.g. both L\* < 35 or both > 75). This catches the screenshot case.
4. **Hue separation** – primary vs accent must differ by ≥ 25° hue OR ≥ 20% saturation, so CTAs don't visually merge.
5. **Neutral anchor required** – exactly one near-neutral surface + one near-neutral text; brand hues are reserved for primary/accent.
6. **Saturation ceiling for surfaces** – background/surface chroma capped (e.g. C\* ≤ 12 in OKLCH) so text stays readable.
7. **Color-blind sanity check** – simulate deuteranopia/protanopia; primary vs accent must still pass rule 4.

## 3. Auto-repair pipeline
When validation fails, don't just warn — fix, then show what changed:

- If bg/fg same tone → flip `text` to the nearest accessible neutral (white #F8FAFC or ink #0B0F19) based on bg lightness.
- If `onPrimary` fails → auto-pick white or ink, whichever passes.
- If primary ≈ accent → rotate accent hue +40° in OKLCH, re-check.
- If surface too saturated → desaturate toward the nearest neutral until C\* ≤ 12.
- Always preserve the **brand-defining hue** (usually `primary`) — repair the supporting roles around it.

Repairs are logged into `palette.audit[]` so the UI can show "Adjusted text color for WCAG AA (was #2A2A2A, now #F8FAFC)".

## 4. Track A (Existing Brand via Firecrawl)
In `venture-brand-wizard`:
- After Gemini extracts raw colors from scraped CSS/screenshots, **classify** each swatch by role using lightness + frequency (largest near-neutral = background, largest saturated = primary, etc.) instead of trusting the model's labels.
- Run `validatePalette()` → `autoRepair()`.
- Surface an "Existing Brand Audit" diff: extracted vs adjusted, with reason per change.

## 5. Track B (Generate from Scratch)
- Constrain the generator prompt to emit the **role schema** above and to satisfy the contrast rules up front.
- Still run `validatePalette()` + `autoRepair()` server-side — never trust the model.
- In Step 2 of `BrandWizard.tsx`, render swatches grouped by role (Surface / Text / Primary / Accent) with a live contrast badge ("AA ✓ 7.1:1") under each pairing, and block "Continue" until all gates pass.

## 6. Downstream consumption
- `canonical-context.ts` / `snapshot-brain.ts`: expose palette as role-tagged tokens (`--bg`, `--fg`, `--primary`, `--on-primary`, …) in the brand block injected into every prompt.
- `website_prd` prompt: instruct the model to use roles, never raw hex pairs it invents; require it to cite `onPrimary` for any CTA.
- Social creative generators: pass `background` + `text` + `primary` + `onPrimary` so generated images keep legible text overlays.
- DOCX brand guide: render a "Color Roles & Pairings" table with contrast ratios next to each swatch pair.

## 7. UI affordances in Brand Wizard Step 2
- Swap the current `bg`/`fg` dots for a **Pairings** strip: Background+Text, Primary+OnPrimary, Accent+OnAccent — each with its contrast ratio and a pass/fail chip.
- "Auto-fix palette" button when any gate fails.
- Lock the "Continue" CTA until the palette is AA-clean.

## Technical notes
- New util: `src/lib/brand/palette-rules.ts` (pure TS, shared by client + edge functions via `supabase/functions/_shared/palette-rules.ts` mirror).
- Use OKLCH (via `culori`) for lightness/chroma/hue math; WCAG contrast via standard sRGB luminance.
- Bump `venture_brand_kits.palette` to `version: 2`; write a migration-free reader that upgrades v1 payloads on read (classify + repair, persist on next save).
- No DB schema change required beyond the JSON shape; no new tables.

## Out of scope
- Replacing the wizard UI flow itself.
- Changing logo generation.
- Multi-theme (light + dark) export — can be a follow-up once roles are in place.
