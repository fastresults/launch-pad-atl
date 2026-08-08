# Shorter, vanity share links

Today a share link looks like:

```text
https://startuplabs.online/v/7356a1c2d9f04b8e1a7c... (48 random characters)
```

After this change it looks like the venture's actual name — for "Anderson Residential Elderly Care":

```text
https://startuplabs.online/v/anderson-residential-elderly-care
```

No invented or unrelated words are ever used. The slug always comes from the venture's own name (or from a name the founder types themselves).

## What changes

1. **Every share gets a slug taken from the venture name.** On create, the venture name is lowercased and hyphenated (`Anderson Residential Elderly Care` → `anderson-residential-elderly-care`). Filler words are dropped only if needed to fit ~40 characters, keeping the leading, most identifying words (`anderson-residential-elderly-care`, then `anderson-residential`, then `anderson`). If the slug is already taken, a numeric suffix is added (`anderson-residential-2`).

2. **Founders can edit it.** The share dialog shows the slug inline with the domain, with an "Edit" control. Rules: 3–40 characters, lowercase letters, numbers and hyphens only, must be unique, a small reserved-word list is blocked. Availability is checked as they type, and saving updates the live link.
3. **No-name fallback.** If a venture has no usable name, the link falls back to a short random slug of 8 characters (`/v/k3m9dq2p`) instead of the current 48.
4. **Old links keep working.** Existing long tokens continue to resolve, so anything already sent out stays live. The dialog shows the new short link for copying.
5. **Changing the slug retires the old one.** If a founder edits the slug, the previous one stops working (they are told this before saving) — the link is meant to be the venture's address, not an alias pile.

## Privacy note

A guessable link is easier to share and also easier to stumble on. The slug is not a password. The dialog will make this explicit and nudge founders to turn on the existing password option for anything sensitive; short random slugs remain available for founders who want unguessable links.
## Mobile-first showcase

Most shared links get opened on a phone. The showcase gets a purpose-built mobile experience rather than a shrunken desktop one:

- **Masthead**: compact single-line bar — logo, venture name, asset count. The long one-liner collapses to two lines with a "more" tap. Sticky, shrinks on scroll.
- **Navigation**: the desktop sidebar is replaced by a bottom sheet ("Contents") opened from a persistent bottom bar, with search pinned at the top of the sheet, collapsible categories, and the active asset highlighted. Tapping an asset closes the sheet and returns you to the top of the reading pane.
- **Bottom action bar**: three thumb-reachable controls — Contents, Ask (Second Brain), and Share. Nothing floats over the text; the current floating launcher is folded into this bar on mobile.
- **Reading pane**: full-bleed width with comfortable side padding, larger base type and line height, generous paragraph spacing, images edge-to-edge with rounded corners, tables horizontally scrollable with a visible edge fade, and code/long URLs wrapped so nothing overflows.
- **Prev/next**: large tap targets pinned above the bottom bar, plus horizontal swipe between assets.
- **Second Brain on mobile**: opens as a full-screen sheet. Chat is a single column with a sticky composer above the keyboard, safe-area insets respected, voice button sized for thumbs. The mind map switches to a pinch/pan canvas with larger node hit areas and a "tap a node to open" hint; on very small screens it defaults to a grouped list view of clusters with the graph one tap away.
- **Performance**: header images lazy-load with width-appropriate sizes, the mind map bundle loads only when its tab is opened, and the first asset renders without waiting for imagery.
- **Polish**: safe-area padding for notch/home-indicator, 44px minimum tap targets, no horizontal page scroll at 320px, and copy-link uses the native share sheet when available.

## Technical notes



- Migration: add `slug text` to `venture_shares` with a unique index (case-insensitive, `where revoked_at is null`), and backfill existing rows from the venture name with collision suffixes. Keep `token` as-is for backward compatibility.
- Slug helper in `src/lib/venture-share.functions.ts`: `slugifyVentureName()`, `newShortToken()` (8-char base32, no ambiguous characters), reserved-word list. `shareUrl()` prefers `slug ?? token`.
- Availability check: a small `security definer` function or a scoped select against `venture_shares` returning only whether a slug is free (no row data).
- `supabase/functions/venture-share/index.ts` and `venture-share-chat/index.ts`: resolve the incoming identifier against `slug` first, then `token`; lower the minimum length guard from 8 to 3 and keep the 128 ceiling. Everything downstream still keys off the resolved `snapshot_id`, so no client-supplied venture id is ever trusted.
- `ShareVentureDialog.tsx` / `ShareLinkBar.tsx`: show the slug as editable text, live validation, copy the short URL.
- `src/routes/v.$token.tsx` needs no routing change — the param is just shorter.
- Mobile: `useIsMobile()` drives a distinct mobile layout in `v.$token.tsx` (sticky compact masthead, bottom action bar, contents bottom sheet) rather than CSS-only hiding; `ShareSection.tsx` gets mobile type/spacing scales and scroll-fade tables; `ShareBrain.tsx` renders as a full-screen sheet with `dvh` sizing and `env(safe-area-inset-*)` padding; `ShareMindMap.tsx` lazy-loads and falls back to a cluster list below ~420px; swipe navigation via a lightweight touch handler on the reading pane.

## Build order

1. Migration + backfill for `slug`.
2. Server-side resolution by slug or token in both share functions.
3. Slug generation on create + short random fallback.
4. Editable slug UI with availability check in the share dialog.
5. Mobile showcase rebuild: masthead, bottom bar + contents sheet, reading pane typography, Second Brain sheet, mind map fallback.

