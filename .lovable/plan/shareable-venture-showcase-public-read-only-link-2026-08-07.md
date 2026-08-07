# Shareable Venture Showcase — public read-only link

Turn a venture into one polished, public URL (`/v/<token>`) that anyone can open with no login: a fixed left table of contents grouped into categories, a wide reading pane on the right, and every image — logos, collateral, social posts, ad creatives, document hero art — rendered inline. The look follows the reference: quiet dark chrome, generous whitespace, serif section headers, thin dividers, sticky nav with active-section highlighting, and smooth scroll.

## What gets included

Everything already generated for the venture, grouped into a curated category tree:

```text
Overview            Cover, one-liner, stage, location, at-a-glance stats
Foundation          Executive summary, vision/mission, problem-solution,
                    value proposition, personas, legal structure
Strategy            Positioning, market analysis, go-to-market, sales
                    playbook, pricing/offer sheet
Brand               Logo lockups, palette, type specimens, full collateral
                    set (business card, letterhead, social kit) as images
Marketing           Social posts + ad creatives by week, captions,
                    90-day content calendar, launch content kit
Operations          Fulfillment SOP, support starter, automations,
                    financial model, tool stack
14-Day Sprint       Day-by-day timeline with each day's assets linked
Bonus               Everything flagged bonus / add-on creatives
```

Categories with nothing generated are hidden — the share never shows an empty shelf. Sub-links under each category are the individual assets, in sprint order.

## Owner controls

A "Share venture" button in the venture hub opens a dialog:

- Create link — generates the token and URL, with copy button.
- Section toggles — uncheck any category or individual asset to exclude it.
- Visibility — public, or public + password.
- Optional expiry date, plus a revoke button that kills the link instantly.
- View count and last-viewed timestamp.

## How the images stay visible

All storage buckets are private, so a public visitor cannot read them directly. The share page never touches storage from the browser. A public edge function assembles the whole payload server-side — documents, brand kit, collateral, social assets, ad images — validates the token, and returns content plus short-lived signed image URLs for exactly the assets that share includes. Nothing outside the shared venture is reachable, and revoking the token immediately breaks every link.

## Experience details

- Left rail: category groups, expandable sub-links, active item tracked to scroll position; collapses to a top drawer on mobile.
- Right pane: each asset as a section with a title, kicker, formatted body, and its hero image; image grids for brand collateral and social posts with lightbox on click.
- Top bar: venture name and logo, and a Print / Save as PDF action that prints the full document cleanly.
- Fully responsive, keyboard navigable, and fast — payload fetched once and cached.
- Open Graph tags so the link previews with the venture logo and one-liner when pasted into any chat or social app.

## Technical notes

- New table `venture_shares`: token, snapshot_id, owner user_id, included section/asset keys, password hash, expires_at, revoked_at, view_count, last_viewed_at. RLS restricts owner reads/writes; the public path goes only through the edge function using the service role.
- New public edge function `venture-share` (`verify_jwt = false`): actions `get` (token → payload) and `track_view`. Signed URLs minted with a short TTL per request.
- New public route `src/routes/v.$token.tsx` plus components `ShareSidebar`, `ShareSection`, `ShareGallery`, and a `SharePage` shell — styled with the existing dark studio tokens, no hardcoded colors.
- Category mapping extends the existing `src/lib/asset-tracks.ts` taxonomy with a `SHARE_CATEGORY` map so ordering stays consistent with the hub.
- Owner UI: `ShareVentureDialog.tsx` wired into the venture hub header.

## Build order

1. Table + share token creation, owner dialog with create/copy/revoke.
2. Public edge function payload assembly with signed image URLs.
3. Share page shell: sidebar, scroll spy, document sections.
4. Image-heavy sections: brand collateral, social posts, ad creatives, lightbox.
5. Polish: OG tags, print stylesheet, password gate, expiry, view tracking.
