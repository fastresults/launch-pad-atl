## Goal

Let admins edit facilitator decks — change copy, swap/replace images, and (optionally) generate new imagery with AI — without touching code. Authored slides stay as the canonical structure; admin edits live as **overrides** in the database and are merged in at render time. Public/user view is unchanged when no overrides exist.

## Architecture

```text
hardcoded slide (.tsx)  ─┐
                         ├──► merge ──► rendered slide
DB overrides (per slug)  ─┘
```

- Authored slides keep their current React form but expose **named editable slots** (text and image). Slots are addressed by `slideId.field` (e.g. `cover.title`, `what-breaks.image`).
- DB stores overrides keyed by `(deck_slug, slide_id, field)`. Render walks the slot ids, swaps in any override before painting.
- No override = exactly today's behavior. Reset = delete row.

## Data model

New table `deck_slide_overrides`:

```text
id uuid pk
deck_slug text             -- 'foundation', 'strategy', ...
slide_id  text             -- 'cover', 'stakes', 'what-breaks', ...
field     text             -- 'kicker', 'title', 'subtitle', 'body', 'card.0.title', 'image'
value_text text null       -- for text fields
value_image_url text null  -- for image fields (lovable-assets URL or storage URL)
value_image_alt text null
updated_by uuid references auth.users(id)
updated_at timestamptz default now()
unique (deck_slug, slide_id, field)
```

- GRANT SELECT to `authenticated` (everyone needs to read overrides when viewing a deck).
- GRANT INSERT/UPDATE/DELETE to `authenticated` but gate via RLS to admins only (`public.has_role(auth.uid(), 'admin')`).
- Storage bucket `deck-images` (public read), admin-only write via RLS.

## Slot wiring (low-risk refactor of authored slides)

Introduce two tiny helpers in `src/components/workshop-slides/slots.tsx`:

- `<SlotText id="cover.title" defaultValue="Foundation.">…</SlotText>` → renders override text if present, else children/default.
- `<SlotImage id="what-breaks.image" defaultSrc={img} alt="…" />` → swaps URL if override present.

Refactor authored slides to wrap editable text and images in these slots. The slot registry (`getSlot(deckSlug, slideId, field)`) reads from a React context that the deck loader hydrates once with overrides for the current deck.

This is the minimum change that makes every slide editable without rewriting them into a JSON schema. Authors can still add new slides in TSX; just wrap editable bits in slots.

## Admin editor UI

New route: `/admin/decks` (admin-only, gated by `has_role`).

- **Deck list** — one card per `STAGE_DECKS` entry showing title, # slides, "has overrides" badge, last edited.
- **Deck editor** (`/admin/decks/$slug`) — two-pane layout:
  - **Left: live preview** — uses the existing `ScaledSlide` shrunk into a fixed canvas; ←/→ to navigate; updates instantly as fields change (optimistic local state, save on blur or "Save changes").
  - **Right: slot inspector** — auto-generated form listing every slot id detected on the current slide:
    - Text slots → `Textarea` with character count and "Reset to default" button.
    - Image slots → current image thumbnail + three actions:
      1. **Upload** (drag-drop, stored via `lovable-assets` CLI path uploaded through an Edge Function to the `deck-images` bucket).
      2. **Replace with URL** (paste any HTTPS URL).
      3. **Generate with AI** — prompt box + style hints; calls a new Edge Function `deck-image-generate` that uses Lovable AI Gateway (`google/gemini-3.1-flash-image` default, with toggle for `openai/gpt-image-2`). Returns a streaming preview, saves the final to `deck-images` bucket, writes the override row.
  - **Footer actions:** Save · Discard · Reset slide to default · Reset entire deck.

- **AI copy assist** (optional but light to add): each text slot has a small "Rewrite with AI" button → modal with tone presets (Sharper, Friendlier, Shorter, Founder-flavored) + free-text instruction, powered by `google/gemini-3.5-flash` through an Edge Function `deck-copy-rewrite`. Returns 2-3 variants; admin picks one.

- **Versioning lite:** every save bumps `updated_at` and writes a row to `deck_slide_override_history` (same shape + `version` int) so admins can revert. Keep the last 20 versions per field.

## Edge Functions

- `deck-image-generate` — accepts `{ prompt, model, slot_id, deck_slug, slide_id }`. Calls Lovable AI Gateway image endpoint with `stream:true`, uploads final PNG to `deck-images` bucket, returns public URL. Admin-only (verify JWT + `has_role`).
- `deck-copy-rewrite` — accepts `{ current_text, tone, instruction }`. Returns 3 variants via `streamText`. Admin-only.
- `deck-override-save` — single endpoint that upserts an override row and appends history. Admin-only.

## Render path

Update `DeckDialog.tsx` and any other deck consumer to:

1. On open, query `deck_slide_overrides` for `deck_slug = slug`.
2. Hydrate a `DeckOverridesProvider` context with the map.
3. `SlotText` / `SlotImage` read from context.

Cached client-side per session; invalidated when admin saves.

## Files touched / created

Created:
- `supabase/migrations/<ts>_deck_overrides.sql` — table, history table, RLS, GRANTs.
- Storage bucket `deck-images` (public) via tool, with admin-only write policies.
- `supabase/functions/deck-image-generate/index.ts`
- `supabase/functions/deck-copy-rewrite/index.ts`
- `supabase/functions/deck-override-save/index.ts`
- `src/components/workshop-slides/slots.tsx` — `SlotText`, `SlotImage`, `DeckOverridesProvider`, `useDeckOverrides`.
- `src/lib/deck-overrides.ts` — fetch/save/reset helpers (TanStack Query).
- `src/routes/_authenticated/admin/decks.tsx` — deck list.
- `src/routes/_authenticated/admin/decks.$slug.tsx` — editor.
- `src/components/admin/decks/SlotInspector.tsx`
- `src/components/admin/decks/ImageSlotEditor.tsx` (upload / URL / AI tabs)
- `src/components/admin/decks/TextSlotEditor.tsx` (with AI rewrite modal)
- `src/components/admin/decks/DeckPreviewPane.tsx`

Modified:
- `src/components/workshop-slides/slides/foundation.tsx` — wrap editable text/images in `<SlotText>` / `<SlotImage>` (one-time pass, no visual change).
- `src/components/workshop-slides/DeckDialog.tsx` — wrap children in `DeckOverridesProvider` with fetched overrides.
- `src/routes/_authenticated/dashboard.tsx` sidebar — add "Facilitator decks" item under the existing Admin section, gated by `has_role`.

Out of scope (call out so we don't scope creep):
- Adding/removing slides or reordering them (editor only changes content, not structure). If you want structural edits later, that's a follow-up.
- Public/non-admin authoring.
- Localization of overrides.

## Validation

- Admin opens `/admin/decks/foundation`, edits the cover title, saves → opening the deck from the Hub shows the new title.
- Replace the "What breaks" card image via AI generation → image appears in modal and in fullscreen.
- "Reset slide" removes overrides, deck returns to authored default.
- Non-admin user gets 403 on the admin routes and on the edge functions.
- Non-admin user viewing the deck still sees admin overrides (overrides are public read).
