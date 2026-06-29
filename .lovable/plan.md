## Social Studio v2 — Agency-Grade, Brand-Locked

Goal: transform the current passive Social Studio panel (which only renders strategy markdown + a "where to post" pill row) into a true creative production studio that (a) is hard-gated on the locked Brand Wizard kit, and (b) generates per-platform **cover images / channel art / pinned post creative** that look like the work of an award-winning agency — fully on-brand (palette roles, typography, logo).

---

### 1. Hard gate: Brand Wizard must exist & be locked

Mirror the gate already used by the Website PRD:

- On mount, fetch `getBrandKit(snapshot.id)`.
- If no kit or `status !== "locked"`, render a **locked state** instead of the studio:
  - Headline: "Lock your brand first."
  - One-sentence rationale: every social asset (cover, avatar, pinned post, story frame) inherits palette roles, type pairing, logo, and voice from your Brand Kit.
  - Primary CTA: **Open Brand Wizard** → opens `<BrandWizard />` (same dialog `BrandStudio.tsx` mounts).
  - Secondary: link to view the in-progress kit if `status === "draft"`.
- Once locked, surface a compact "Locked to brand: [palette swatch row] · [heading font] · [body font] · [logo thumb]" header. Add a "Brand updated → regenerate" stale badge if `brand_kit.updated_at > latest social asset.created_at` (mirrors the stale-concept pattern already in `hub.$snapshotId.tsx`).

### 2. Social Studio IA (three tabs)

```text
[ Strategy ]   [ Channel Setup ]   [ Cover Art ★ ]
```

- **Strategy** — existing markdown panels (audit, pillars, calendar preview, launch kit). Unchanged except dark/light token cleanup.
- **Channel Setup** — current "Where to post" row, expanded into actionable cards per platform (handle suggestion from brand kit, bio copy from launch kit, link-in-bio).
- **Cover Art** — the new agency-grade generator (focus of this plan).

### 3. Cover Art generator — what an agency would actually ship

For every recommended platform, the studio produces a **kit of correctly-sized creative**, not one generic banner. Reference spec set (locked, not user-typed):

| Platform   | Assets generated                                       | Canonical size      |
|------------|--------------------------------------------------------|---------------------|
| Instagram  | Profile avatar, 3-tile pinned grid, Story cover icons  | 1080×1080, 1080×1920 |
| TikTok     | Profile avatar, video cover poster                     | 1080×1920           |
| LinkedIn   | Company banner, founder banner, square pinned post     | 1128×191, 1584×396, 1200×1200 |
| X          | Header, profile avatar, pinned post card               | 1500×500, 1200×675  |
| YouTube    | Channel art (safe-area aware), video thumbnail         | 2560×1440, 1280×720 |
| Facebook   | Page cover, square post                                | 1640×624, 1200×1200 |
| Pinterest  | Profile cover, vertical pin                            | 800×450, 1000×1500  |
| Threads    | Avatar + intro card                                    | 1080×1080           |
| Reddit     | Banner, snoo-style avatar                              | 1920×384, 256×256   |

Only platforms marked **Yes / Maybe** in the audit get cards; **Skip** is hidden.

#### 3a. Creative direction (the "award-winning" part)

A `coverArtDirectorPrompt` builder composes a system prompt from the brand kit + venture context so output reads like agency work, not stock AI:

- **Brand authority injection** (verbatim, like Website PRD): hex codes for `background / surface / primary / onPrimary / accent`, heading + body font families, logo description, brand voice spectrum scores, audience persona, single sentence positioning.
- **Composition rules** baked in:
  - One dominant focal element + generous negative space (no clutter).
  - Type-led layouts when the platform shows text well (LinkedIn banner, X header, YouTube thumb); image-led for IG/TikTok/Pinterest.
  - Logo placement zone reserved (16px safe inset from platform-specific safe area, e.g. YouTube center 1546×423).
  - Strict 2-color rule per asset (background + 1 accent from palette), never all five.
  - Forbid: gradients-by-default, emoji, stock-AI tropes (neon swirls, generic "tech mesh"), text artifacts, fake screenshots.
  - WCAG contrast: any text rendered must use a palette pair pre-validated by `palette-rules.ts`.
- **Style ladder**: pick one of 4 art directions per generation batch so the user sees range:
  1. *Editorial* — type-forward, magazine-grade, lots of whitespace.
  2. *Photographic* — cinematic subject + soft brand-tint overlay.
  3. *Geometric* — bold shapes from brand palette, Bauhaus discipline.
  4. *Illustrative* — flat custom illustration in brand colors.

#### 3b. Generation pipeline (edge function `venture-social-cover`)

```text
client → invoke('venture-social-cover', { snapshotId, platform, asset, direction })
  ↓
edge function:
  1. assertBrandKitLocked(snapshotId)              // hard gate server-side
  2. loadCanonicalContext(snapshotId)              // venture + concept summary
  3. buildDirectorPrompt(brandKit, context, platform, asset, direction)
  4. AI Gateway → google/gemini-3.1-flash-image    // native image gen, brand-aware
       - pass uploaded primary logo as reference image (so it can be respected, not redrawn)
       - request exact platform pixel dimensions
  5. paletteRules.assertContrastOnRenderedText()   // post-check; reject + retry once
  6. upload to user-media bucket → media_assets row tagged
       { kind: "social_cover", platform, asset, direction, snapshot_id, brand_kit_version }
  7. return signed_url + metadata
```

Generate the 4 directions in parallel per asset so the founder picks. Each card has: **Use this**, **Regenerate this one** (per-card busy state, same pattern as Concept Studio), **Remove**, **Download**, **Save to My Files** (DOCX/zip via existing `attendee.functions` upload), **Copy caption** (caption auto-drafted from launch kit voice).

#### 3c. UI — Cover Art tab

```text
┌─ Cover Art ─────────────────── Locked to: ●●●●● Inter/Söhne  [Regenerate all] ┐
│ ┌─ Instagram ─────────────────────────────────────┐                           │
│ │ Avatar  | Pinned grid (3) | Story cover         │  per-asset row            │
│ │ [thumb] | [t][t][t]       | [thumb]             │                           │
│ │ Editorial · Photographic · Geometric · Illustr. │  4 direction tabs         │
│ └─────────────────────────────────────────────────┘                           │
│ … one card per recommended platform …                                         │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Tab/card uses semantic tokens (`bg-card`, `text-foreground`, `text-status-*`) — keeps the light/dark contrast fix the user has repeatedly asked for.
- Sticky footer: **Download full kit (.zip)** — zips every selected asset, organized `/<platform>/<asset>.png` plus a `README.md` with sizes and captions.

### 4. Persistence

New table `venture_social_assets` (mirrors `social_brand_assets` pattern):

```sql
id, snapshot_id, user_id, platform, asset_kind, art_direction,
storage_path, signed_url, signed_url_expires_at, width, height,
prompt_used, model_used, brand_kit_version, is_selected, created_at
```

Grants for `authenticated` + `service_role`; RLS by `user_id = auth.uid()`. Selection (one per platform+asset) lives on the row.

### 5. Files touched / added

- **New** `supabase/functions/venture-social-cover/index.ts` — gated generator described above.
- **New** `supabase/functions/_shared/social-platform-specs.ts` — canonical sizes + safe areas.
- **New** `supabase/functions/_shared/cover-art-director.ts` — prompt builder + style ladder.
- **New** migration: `venture_social_assets` table + grants + RLS + bucket policy reuse (`user-media`).
- **New** `src/components/hub/social/SocialStudioGate.tsx` — locked-state UI.
- **New** `src/components/hub/social/CoverArtTab.tsx` + `PlatformCard.tsx` + `DirectionThumb.tsx`.
- **New** `src/lib/social-cover.functions.ts` — invoke + list/select/delete + zip export.
- **Edit** `src/components/hub/SocialStudio.tsx` — wrap in `Tabs`, mount gate, mount new tab. Keep existing Strategy markdown rendering intact.
- **Edit** `src/lib/framework-deliverables.ts` (only if a deliverable tooltip needs the new capability surfaced).

### 6. Validation

- Brand kit not locked → Social Studio renders gate, no edge calls fire.
- Locked → generation respects exact platform pixel sizes (assert in tests against `social-platform-specs`).
- Output palette validated by existing `palette-rules.ts` (re-used from Brand Wizard).
- Regenerating one card does NOT spinner the others (busy-state scoping pattern reused).
- Brand Kit updated after generation → stale badge appears; "Regenerate all" clears it.

### 7. Out of scope (deliberate)

- Auto-posting / scheduling (Zernio connector flow stays in admin Social).
- Video creative (still images + posters only this pass).
- Per-asset manual prompt editing (the whole point is brand-locked agency output; advanced editing can come later).
