# Smarter collateral details prefill + website button on the shareable link

Two connected changes: make the "Confirm your details" form arrive already filled in from everything we know, and surface the venture's website as a featured button on the public showcase.

## 1. Pre-populate the details form

Today the form seeds only from structured records: the snapshot, the attendee profile, and the brand kit DNA. Anything not stored in those columns (website, phone, tagline, entity name, social handle, address) shows up blank and the founder types it by hand.

New behaviour:

- When the form opens and required fields are still empty, run one AI scrub over the founder's own material — business brief, founder/market profile, and the completed venture assets (executive summary, offer & pricing, go-to-market, legal/formation) — and fill in what it can find.
- Structured data always wins. AI values only fill gaps, never overwrite something already saved or already present in a real record.
- Each AI-filled field is labelled "Suggested" in the form, with a one-line note saying where it came from (e.g. "from your executive summary"). The founder edits or clears any of them before confirming.
- The scrub result is cached on the brand kit so re-opening the form is instant and doesn't re-bill a model call. A small "Re-scan my content" action re-runs it on demand.
- Nothing changes about confirming: pressing "Confirm details" still normalises everything, marks generated collateral stale, and drives all nine pieces from the exact confirmed words.

Fields covered by the scrub: tagline, website, email, phone, social handle, city/state, legal entity line, payment terms, and voice.

## 2. Website button on the shareable link

The website value the founder confirms in that form is the same one printed on the card and letterhead — it should be clickable on the public showcase.

- Add the confirmed website (plus company name) to the public share payload.
- Show it as a featured button in the showcase sidebar, above the table of contents, styled with the venture's brand accent — label reads "Visit website" with the bare domain underneath.
- Also mirror it as a compact link in the showcase header on mobile, where the sidebar is collapsed.
- Opens in a new tab, `rel="noopener noreferrer"`. If no website is confirmed, the button simply doesn't render.
- The URL is normalised for display (no `https://`, no trailing slash) but linked with a proper scheme.

## Technical notes

- `supabase/functions/venture-collateral/index.ts`: extend `seedDetails` into a two-pass seed — structured seed first, then an AI gap-fill (Lovable AI, `google/gemini-3.6-flash`, JSON output) reading `attendee_business_brief` and completed `venture_documents`. Persist as `contact_details_suggested` + `contact_suggested_at` on `venture_brand_kits` (new nullable jsonb/timestamptz columns via migration); return `suggested: { key: { value, basis } }` alongside `details`.
- `src/lib/collateral.functions.ts`: carry `suggested` through `getCollateralDetails`; add `rescanCollateralDetails(snapshotId)` calling a new `details:rescan` action.
- `src/components/hub/brand/CollateralDetailsDialog.tsx`: render a "Suggested" badge and basis text for suggested keys; clear the badge once the user edits the field; add the re-scan button in the footer.
- `supabase/functions/venture-share/index.ts`: include `website` (from the kit's confirmed `contact_details`, falling back to `snapshot.website_url`) in the payload; type it in `src/lib/venture-share.functions.ts`.
- `src/components/share/ShareSidebar.tsx` + `src/routes/v.$token.tsx`: render the featured website button.
