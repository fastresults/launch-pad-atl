# Shared link: rich ad preview modal

## What I verified (not guessing)

I ran the real showcase link end to end in the running app and opened a Campaign week 4 creative.

- The backend payload is correct: every ad image already carries platform, week, day, pillar, aspect, headline, hook, post copy, CTA and hashtags.
- The rich modal already renders in the current code: artwork on the left, and on the right the eyebrow (LINKEDIN / FACEBOOK · WEEK 4 · WEDNESDAY · 1:1), headline, pillar, Download / Print / Copy caption / Open, plus copy blocks for Headline, Hook, Post copy, Call to action and Hashtags with per-field Copy buttons.

The modal in your screenshot is the **old** one — a bare full-width image with a round purple close button. That version no longer exists in the code. So what you are looking at is a stale build being served on the public/published showcase URL (or a cached bundle in that browser tab), not a missing feature.

## The fix

1. **Republish the app** so the public showcase and custom domains serve the current bundle. This is the actual fix for what you saw.
2. **Make staleness impossible to mistake again**: stamp a small build/version marker into the showcase payload response and log it on the showcase page, so a stale front end is obvious in one look instead of a guessing round.
3. **Harden the preview so it can never silently degrade**:
   - If an image somehow arrives without copy metadata, the panel states it plainly instead of collapsing to an image-only modal.
   - The copy panel is always rendered, at every breakpoint, including mobile where it stacks under the artwork.
4. **Add a regression test** that opens a campaign image in the showcase and asserts the modal contains headline, post copy, CTA, hashtags and the Download / Print / Copy caption controls — so a future change cannot quietly drop the copy panel.

## Technical notes

- Payload: `supabase/functions/venture-share/index.ts` already attaches `meta` per ad image; no schema change needed.
- UI: `src/components/share/ImagePreviewDialog.tsx` (already two-column) and `src/components/share/ShareSection.tsx` wiring stay as-is; only the always-render / empty-state hardening and the version marker are added.
- Test: a Playwright-driven check against the local showcase route asserting modal content.

## Do this first

If you want the immediate unblock with no code change at all: publish. That alone restores the rich modal on the public link.
