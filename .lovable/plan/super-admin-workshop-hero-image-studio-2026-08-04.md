# Super Admin: Workshop hero image studio

A new admin screen at `/admin/hero-images` where every rotating hero image across all eight build workshops can be reviewed side by side, and any single image can be regenerated from its prompt — edited or as-is — without a code change or redeploy.

## What you get

**Review**
- Workshop picker (tabs/select) across the eight build workshops, plus an "All" grid.
- Each pain renders a card: the current image, the pain label, the first-person question typed in the hero, and the full prompt it was generated from.
- Flags at a glance: "Missing image", "Override active" (regenerated in admin), "Bundled" (the shipped file).

**Regenerate**
- Each card has Regenerate. It opens the prompt pre-filled with the exact composed prompt (subject + shared cinematic look + screen-content rule + tier tail) so nothing has to be retyped.
- Editable fields: the subject line, a screens on/off toggle, and the model (default the premium Gemini image model). The shared look and rules are appended automatically — same recipe used to generate the current set.
- Generate produces a preview. You either Publish it (goes live on the public hero immediately) or Discard it.
- Publishing stores the new image and the prompt that made it, so the record of "what made this picture" stays accurate.

**Manage**
- Revert to bundled image (drops the override).
- Version history per pain: previous generations stay listed with their prompts so an earlier take can be re-published.
- Upload your own image for a pain, as an escape hatch when a prompt won't converge.
- Batch action: "Regenerate all missing" for a workshop, run sequentially with progress.

## How the public site picks it up

Today hero images are files bundled at build time from `src/assets/scenes/workshops/<slug>/<pain-id>.jpg`. Regenerating at runtime cannot write into the repo, so overrides live in the backend and are layered on top: the hero loads the bundled set instantly (no flash, no regression if the backend is slow) and swaps in any published override once it resolves. Prompts stay in code as the source of truth for the original set; the override table records edited prompts.

## Technical notes

Backend
- New table `workshop_hero_images`: `id`, `workshop_slug`, `pain_id`, `storage_path`, `prompt`, `subject`, `screens boolean`, `model`, `status` (`draft` | `published` | `archived`), `created_by`, `created_at`. Unique partial index on (`workshop_slug`, `pain_id`) where `status = 'published'`.
- Grants: `SELECT` to `anon` and `authenticated` (public hero reads published rows), full CRUD to `authenticated` gated by `is_admin(auth.uid())`, `ALL` to `service_role`. RLS: published rows readable by everyone; insert/update/delete admin-only.
- New public storage bucket `workshop-hero-images` (public read so the hero can use plain URLs and CDN caching; writes service-role only from the function).
- New edge function `workshop-hero-image-generate`, modeled on `supabase/functions/deck-image-generate/index.ts`: admin check via `is_admin`, composes the prompt server-side with the same `SCENE_BASE` / `SCREEN_CONTENT` / `SCENE_TAIL` strings (moved into `supabase/functions/_shared/` and imported by `src/lib/workshop-pains.ts` equivalent constants so both sides stay identical), calls `https://ai.gateway.lovable.dev/v1/images/generations` with `google/gemini-3-pro-image`, uploads the PNG, inserts a `draft` row, returns the public URL.
- A second lightweight action publishes a draft (archive the current published row, mark the draft published) — handled with a direct table update from the admin client, no extra function.

Frontend
- `src/routes/_authenticated/_admin/admin.hero-images.tsx` — the studio screen; `src/components/admin/hero-images/` for the grid, card, and regenerate dialog. Sidebar entry added in `src/components/admin/AdminSidebar.tsx`.
- `src/lib/workshop-hero-images.functions.ts` — list/publish/revert/upload/history helpers.
- `src/lib/workshop-scenes.ts` gains an override merge: keep `getWorkshopScenes(slug)` synchronous for the bundled set, and add `useWorkshopSceneOverrides(slug)` that the hero applies after fetch, replacing `image` for any pain with a published override.
- Prompt composition on the client reuses the exported `scenePrompt()` in `src/lib/workshop-pains.ts` so the dialog shows exactly what the function will send.

Out of scope
- Foundation workshop keeps the founder scene library; only the eight build lanes appear in the studio.
- No change to the pain copy, questions, or rotation logic.
