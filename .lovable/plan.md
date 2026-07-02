## Creative Director's Audit — the attached 1:1 Instagram ad

Three shippable failures visible on one frame:

1. **Headline is guillotined on both ends.** The purple SIGNATURE sidebar runs full-height on the left and clips the first character of every line ("y most / l in the / s not th"). The right edge is also cropped. The model painted a full-bleed headline behind a full-bleed sidebar — two systems fighting for the same real estate.
2. **Logo appears twice.** The model redrew a "startuplabs" wordmark into the composition (bottom band) despite hard bans; then our compositor stacked the real logo on top. Two slightly-offset marks read as a duplication artifact.
3. **Logo chip is a grey plate.** The compositor fell back to a low-contrast scrim over a busy photo, producing a "sticker on a photo" look — the exact anti-agency artifact the brief forbids.

Contributing root causes in code:

- `cover-art-director.ts` reserves a small logo *corner* zone but never reserves a headline zone or a sidebar-vs-headline exclusion, so headline + sidebar collide.
- Post hooks are passed verbatim up to 64 chars; long hooks like *"Why most small businesses fail in the first 90 days (It's not th…"* are already pre-truncated mid-word, then the model wraps them further.
- Passing the **wordmark logo as a reference image** to Gemini invites the model to reproduce that wordmark in the scene (classic multimodal echo). The BANNED list warns against it in prose but the reference is right there.
- The compositor's chip fallback (`compositeLogo` → rounded plate w/ shadow) triggers when the logo is opaque; on a busy photo the plate is the wrong solution.

---

## Fix plan (agency-grade, minimal-scope)

### 1. Kill the headline/sidebar collision — reserve a real headline zone

In `cover-art-director.ts` `assetSystem()` (pinned_post / story_cover branch), add a **HEADLINE LANDING AREA** directive alongside the LOGO LANDING AREA when a custom headline is present. For 1:1 / 4:5 / 9:16:

- Top band, full width minus 8% insets, height ≈ 22% (1:1) / 18% (4:5) / 14% (9:16).
- Explicit rule: **no sidebar stripe, no signature block, no photo subject, no logo may enter or cross the headline band's edges.**
- Signature sidebar cap already exists (28% width on square/portrait) — tighten to require the sidebar to start **below** the headline band, not full-height.

### 2. Stop shipping mid-word headlines

`resolveAdHeadline()` in `content-ad-director.ts` currently `.slice(0, 64)` — that produces "…It's not th". Replace with a **word-safe truncator**:

- Cap at 60 chars, break on the last whole word ≤ cap, append `…` only if truncated.
- Also expose a soft cap per aspect: 60 for 1:1, 70 for 4:5, 80 for 9:16.
- Return the truncated text back to the UI so the modal's "Headline on image" chip shows exactly what will render (no user surprise).

### 3. Eliminate the second "startuplabs" ghost

The safest agency move: **do not send the wordmark logo to the image model as a reference for content ads.** The palette tile alone is enough to lock colors. The compositor still places the real logo after generation.

- In `venture-content-ad/index.ts`, drop `logoDataUrl` from the `refs` array passed to `callMultimodal` (keep the palette tile). Continue to composite the real logo after.
- Keep passing the logo for the **avatar** flow (that path *requires* it).
- Add a second guardrail: when the wordmark contains the brand text as glyphs, add a `BANNED` line naming the exact wordmark string ("Do NOT render the letters "startuplabs" anywhere on the canvas") so if we ever re-enable the reference the model has an explicit ban.

### 4. Replace the grey chip with a brand-native lockup

In `logo-compositor.ts`:

- For non-avatar placements on photographic/illustrative directions, replace the fallback rounded chip with a **surface-color footer band**: a full-width strip in `plan.surface` at the bottom (height ≈ logo box height + 2× inset), logo left-aligned inside it. Reads as an editorial masthead, not a sticker.
- For editorial / geometric directions, keep direct-composite on negative space (already works).
- Remove the `scrim` branch; if contrast would fail, escalate to the footer-band path instead. No more translucent grey plates.
- Keep the drop shadow off when the band is present.

### 5. QA gate before shipping the frame

Extend `runContrastQa` (or add a light post-check) to flag two new failure modes and trigger one retry:

- **Text-in-sidebar**: sample the leftmost 30% of the top headline band; if it contains ink-colored letterform pixels overlapping signature-colored pixels, mark `HEADLINE_CLIPPED` and retry with a stronger sidebar/headline exclusion note.
- **Duplicate-wordmark**: sample the bottom 20% for high-frequency letterform edges *before* compositing our logo; if present, mark `LOGO_REDRAWN` and retry with the explicit ban.

Both retries reuse the existing `generate(retryNote)` path — no new gateway plumbing.

### Files touched

- `supabase/functions/_shared/cover-art-director.ts` — headline zone, sidebar/headline exclusion, explicit wordmark-string ban.
- `supabase/functions/_shared/content-ad-director.ts` — word-safe headline truncation, per-aspect caps.
- `supabase/functions/_shared/logo-compositor.ts` — footer-band lockup, remove grey scrim fallback.
- `supabase/functions/_shared/image-qa.ts` — two new checks (`HEADLINE_CLIPPED`, `LOGO_REDRAWN`).
- `supabase/functions/venture-content-ad/index.ts` — drop logo from multimodal refs for content ads, wire the two new QA retries, return the final truncated headline in the response payload.
- Redeploy: `venture-content-ad` (and `venture-social-cover` if we want the same headline-zone fix there — recommended).

### Out of scope for this pass

- Client UI changes beyond echoing the truncated headline back into the preview modal's "Headline on image" chip.
- Any new controls (headline-position picker, footer-band toggle) — parked until the fixes above are validated on a regenerated frame.
