## What's broken

Both screenshots show the same class of failure in Content Studio ads:

- **IG ad (2nd screenshot)** — the model rendered the headline "Why most small businesses fail…" starting in the top-left, and our logo compositor then dropped the wordmark on top of the headline. QA even flagged it (`QA fail · 2.42:1`).
- **FB ad (1st screenshot)** — the model turned the reserved zone into a full-bleed purple sidebar with the headline set vertically inside it; the logo chip lands on top of that stripe. The "reserved" area behaved as an invitation to fill, not to leave blank.

### Root cause

`logoSafeZone()` in `supabase/functions/_shared/logo-compositor.ts` was written for a 16:9 canvas. It multiplies width by `(9/16)` unconditionally:

```
widthPct = boxWShortFrac * (9/16) * 100    // ← always assumes 16:9
```

For a 1:1 or 4:5 Content Studio ad the actual composited chip is ~36% × 9% of the canvas, but the prompt tells the model to leave only ~20% × 9%. The model believes it has room to run the headline into that area, and the compositor then paints on top of it.

Second contributing factor: the "reserved zone" language is descriptive, not a hard exclusion, and the signature-coverage rule pushes Editorial layouts toward a full-height sidebar that collides with the top-left logo corner on square/portrait canvases.

## Plan

### 1. Make the reserved-zone math canvas-aware

`supabase/functions/_shared/logo-compositor.ts`
- Change `logoSafeZone(placement, size, logoAspect)` → `logoSafeZone(placement, size, logoAspect, canvasW, canvasH)`.
- Compute `boxW`/`boxH` in pixels using the same `targetBoxFor()` logic the compositor already uses, then derive `widthPct = boxW / canvasW * 100`, `heightPct = boxH / canvasH * 100`. No more `9/16` fudge.
- Export a single `computeLogoBox(placement, size, logoAspect, W, H)` used by both `logoSafeZone` and `compositeLogo` so the prompt hint and the composite are literally the same rectangle.

### 2. Move the logo away from the headline on square/portrait ads

`supabase/functions/_shared/logo-compositor.ts` + `venture-content-ad/index.ts`
- For `pinned_post` on 1:1 and 4:5 aspects, change default placement corner from `top-left` to `bottom-right` when a headline is present (headline anchors top-left in Editorial). Keep `top-left` when `headlineOverride.mode === "none"`.
- Default `logoSize` for Content Studio ads to `sm` (≈10% h, ≈28% w cap) instead of `md`. Founders can still override in the Regenerate dialog.

### 3. Harden the prompt so the reserved area actually stays empty

`supabase/functions/_shared/cover-art-director.ts` — inside `zone(...)`:
- Add a one-liner exclusion: *"No headline, subhead, callout, sticker, sidebar, color block, or signature splash may enter this rectangle. If any text overlaps it, the composition is rejected."*
- Add: *"Any signature block, sidebar stripe, or focal shape must terminate at least 8% away from the edges of this rectangle."*

### 4. Keep the signature sidebar from swallowing the logo corner

`supabase/functions/_shared/cover-art-director.ts` (Editorial brief) + `canvas-plan.ts` if needed
- For 1:1 / 4:5 assets specifically, cap the sidebar/signature block width at ~28% of canvas width and forbid it from touching the reserved logo corner. The 55% negative-space rule stays; only the sidebar geometry changes.

### 5. Post-composite safety net

`supabase/functions/_shared/logo-compositor.ts`
- When placement is `post-lockup` and the average luminance of the region under the logo is close to the chip surface (already computed as `surfaceLum ≈ baseLumBehind`), always paint the shadow scrim — even in the transparent-PNG direct path. This prevents the "logo washed into headline" look if the model still misbehaves.

### 6. Verify

- Deploy `venture-content-ad`, regenerate the two failed posts from the screenshots at 1:1.
- Check edge-function logs for `[logo-compositor] chip=…` and confirm the prompt's reserved-zone percentages now match the composited chip within ±1%.
- Visual pass: logo sits in bottom-right, headline stays top-left, no overlap, no full-height purple stripe.

### Scope

Backend/prompt-only. No UI changes, no schema changes. Files touched:

```
supabase/functions/_shared/logo-compositor.ts
supabase/functions/_shared/cover-art-director.ts
supabase/functions/venture-content-ad/index.ts
```

Brand Wizard and Social Studio call the same shared code, so they inherit the fix — I'll spot-check one Social cover after deploy to confirm no regression there.
