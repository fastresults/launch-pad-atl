# Shorter, vanity share links

Today a share link looks like:

```text
https://startuplabs.online/v/7356a1c2d9f04b8e1a7c... (48 random characters)
```

After this change it looks like:

```text
https://startuplabs.online/v/harbor-oak-care
```

## What changes

1. **Every share gets a readable slug.** When a founder creates a share link, the slug is derived from the venture name (lowercased, hyphenated, trimmed to ~32 characters). If that slug is already taken, a short suffix is added (`harbor-oak-care-2`).
2. **Founders can edit it.** The share dialog shows the slug inline with the domain, with an "Edit" control. Rules: 3–40 characters, lowercase letters, numbers and hyphens only, must be unique, a small reserved-word list is blocked. Availability is checked as they type, and saving updates the live link.
3. **No-name fallback.** If a venture has no usable name, the link falls back to a short random slug of 8 characters (`/v/k3m9dq2p`) instead of the current 48.
4. **Old links keep working.** Existing long tokens continue to resolve, so anything already sent out stays live. The dialog shows the new short link for copying.
5. **Changing the slug retires the old one.** If a founder edits the slug, the previous one stops working (they are told this before saving) — the link is meant to be the venture's address, not an alias pile.

## Privacy note

A guessable link is easier to share and also easier to stumble on. The slug is not a password. The dialog will make this explicit and nudge founders to turn on the existing password option for anything sensitive; short random slugs remain available for founders who want unguessable links.

## Technical notes

- Migration: add `slug text` to `venture_shares` with a unique index (case-insensitive, `where revoked_at is null`), and backfill existing rows from the venture name with collision suffixes. Keep `token` as-is for backward compatibility.
- Slug helper in `src/lib/venture-share.functions.ts`: `slugifyVentureName()`, `newShortToken()` (8-char base32, no ambiguous characters), reserved-word list. `shareUrl()` prefers `slug ?? token`.
- Availability check: a small `security definer` function or a scoped select against `venture_shares` returning only whether a slug is free (no row data).
- `supabase/functions/venture-share/index.ts` and `venture-share-chat/index.ts`: resolve the incoming identifier against `slug` first, then `token`; lower the minimum length guard from 8 to 3 and keep the 128 ceiling. Everything downstream still keys off the resolved `snapshot_id`, so no client-supplied venture id is ever trusted.
- `ShareVentureDialog.tsx` / `ShareLinkBar.tsx`: show the slug as editable text, live validation, copy the short URL.
- `src/routes/v.$token.tsx` needs no routing change — the param is just shorter.

## Build order

1. Migration + backfill for `slug`.
2. Server-side resolution by slug or token in both share functions.
3. Slug generation on create + short random fallback.
4. Editable slug UI with availability check in the share dialog.
