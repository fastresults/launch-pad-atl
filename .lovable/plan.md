# AI-First Brand Intake — restructure Step 0 of the social setup wizard

## Goal

Replace the manual Brand Kit form with a short AI-guided intake that drafts **everything every platform needs** in one pass. Novice users answer 3 short prompts, AI generates a full Brand Package, user reviews/edits inline, then Creative Studio and the 14 platform cards consume that package automatically.

## New flow

```
Step 0 — AI Brand Intake   (NEW: 3 prompts → AI drafts everything → user reviews)
Step 0.5 — Creative Studio (existing, now auto-prefilled with vibe/colors/subject)
Steps 1-14 — Platform cards (existing, now show per-platform bio + launch copy ready to paste)
```

## Step 0 — guided intake (3 sub-steps, no jargon)

1. **Tell us about your startup** — one textarea, 2-4 sentences. Placeholder: "We help X do Y so they can Z. Our vibe is…". Optional: industry chip, founder name, website URL if known.
2. **Pick an audience tone** — 4 chips (Professional, Founder-personal, Playful, Authoritative).
3. **Generate Brand Package** — full-screen progress UI streaming sections as they arrive (Identity → Per-platform bios → Visual direction → Launch kit). Each section appears in an editable card the moment it streams in.

After generation, a single "Review your Brand Package" screen with collapsible sections:
- **Identity** — display name, 5 handle suggestions (with one-click "check availability" stubs that just open the platform's handle-check page), short bio (160ch), long bio (~600ch)
- **Per-platform bios** — X (160), Instagram (150), LinkedIn personal (220), LinkedIn company tagline (120) + About (2000), YouTube About (1000), TikTok (80), Threads (150), Bluesky (256), Mastodon (500), Pinterest (160), Reddit (200), Facebook Page short description (255), Discord server description (120)
- **Visual direction** — vibe (preselected from 6), color mood (preselected from 5), 3 brand hex colors, one-line logo prompt for Creative Studio
- **Launch kit** — pinned-post copy (per platform-shape), link-in-bio blurb, 5 starter hashtags, 3 first-week post ideas

Every field has "Regenerate this" (single-field re-prompt) and inline edit. "Save & continue" persists everything and unlocks Creative Studio.

## Downstream wiring

- **Creative Studio** — pre-fills vibe + color mood + brand colors + subject from the Brand Package. User can still override. The `logo_prompt` becomes a one-click "Generate logo mark" tile alongside the existing 4 asset types.
- **Platform cards** (`admin.social.setup.$platform.tsx`) — at the "Profile completed" stage, render a "Copy paste pack" panel: that platform's bio variant + display name + handle + link-in-bio blurb + generated avatar/cover with download buttons. Removes the "type your bio from memory" step entirely.

## Files

**New**
- `supabase/functions/brand-intake/index.ts` — CORS + JWT + admin gate + Zod. Calls Lovable AI Gateway `google/gemini-3-flash-preview` with `Output.object` structured output for the full Brand Package schema. Streams partial sections via SSE. Persists final package to `social_setup_brand` + new `social_setup_brand_package` row.
- `supabase/functions/brand-intake/schema.ts` — shared Zod schema for the Brand Package (identity, perPlatformBios, visualDirection, launchKit).
- `supabase/functions/brand-intake/prompts.ts` — system prompt + per-field regeneration prompts.
- `src/lib/brand-intake.functions.ts` — `streamBrandIntake`, `regenerateField`, `getBrandPackage`, `saveBrandPackage` (TanStack Query).
- `src/routes/_authenticated/_admin/admin.social.setup.intake.tsx` — the 3-step intake wizard + streaming review screen.

**Edit**
- `src/routes/_authenticated/_admin/admin.social.setup.tsx` — replace the manual `BrandSection` form with a summary card: shows package status (Not started / Drafted / Approved), CTA "Open AI Brand Intake" or "Review Brand Package". Keep `CreativeStudioCard` below it; gate Creative Studio behind `brand_package_approved`.
- `src/routes/_authenticated/_admin/admin.social.setup.$platform.tsx` — add the "Copy paste pack" panel that reads from the Brand Package for that platform.
- `src/routes/_authenticated/_admin/admin.social.setup.creative.$assetType.tsx` — auto-select vibe/color/subject from package; add "Logo mark" asset type.
- `src/lib/creative-vibes.ts` — add `logo_mark` asset type (1024×1024, transparent-friendly prompt fragment).
- `src/lib/social-setup.functions.ts` — add `getBrandPackage`, `upsertBrandPackage`, `updateBrandPackageField` helpers.
- `src/lib/zernio-setup-guides.ts` — add `bioMaxLength` and `bioFieldKey` per platform so the platform card knows which package field to surface.
- `src/App.tsx` — register the new `admin.social.setup.intake` route.

## Database (one migration)

New `public.social_setup_brand_package`:
- `user_id` PK, `status` (`draft` | `approved`), `intake_input` jsonb (the 3 user answers),
- `identity` jsonb (display_name, handle_suggestions[], short_bio, long_bio)
- `per_platform_bios` jsonb (keyed by platform)
- `visual_direction` jsonb (vibe, color_mood, brand_colors[], logo_prompt)
- `launch_kit` jsonb (pinned_posts keyed by platform-shape, link_in_bio, hashtags[], first_week_ideas[])
- `model_used`, `tokens_used`, timestamps
- RLS scoped to `auth.uid()`, service_role full, admin read via `has_role`
- Full GRANT block per project standard (authenticated + service_role; no anon)

Extend `public.social_setup_brand`: nothing new (already has `vibe`, `color_mood`, `brand_colors` from the prior migration). The intake function writes through to these fields so Creative Studio keeps working unchanged.

Extend `public.social_setup_progress`: add `brand_package_approved boolean default false` (mirrors `creative_ready` pattern).

## AI details

- **Model**: `google/gemini-3-flash-preview` (default per stack), `Output.object` with the full Brand Package Zod schema for a single structured generation.
- **Per-field regenerate**: same model, smaller schema scoped to the one field, with the rest of the package passed as context so regenerations stay on-brand.
- **No new secrets** — `LOVABLE_API_KEY` already configured.
- **Errors**: 402 → "Out of AI credits" toast with link to workspace billing. 429 → "Slow down, try again in a moment".

## Out of scope (v1)

- Real handle availability checks via platform APIs (we link out to each platform's handle-check page instead).
- Tone re-training from existing user content.
- Multi-language brand packages (English only v1).
- Auto-posting the launch kit (user still pastes).
