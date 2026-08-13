# Welcome Modal for the Venture Showcase

Add a first-time welcome modal to the public venture showcase (`/v/:token`) that introduces a client to what they are receiving and how to get the most value from it — written as a personal note from Adam Anderson.

## What we are building

- A new `ShareWelcomeModal` component rendered inside `src/routes/v.$token.tsx`.
- The modal appears only on the first visit to a given showcase token, then dismisses for that browser (localStorage key scoped to the token).
- The body is a short personal note from Adam: what the showcase is, the best order to review it, and a direct CTA to reply or book a call.
- A second, smaller "How to use this" helper remains available from the sidebar/masthead if the visitor wants a refresher.

## Copy direction

Personal note from Adam, ~120–150 words. Covers:

1. **What you are looking at** — a complete startup foundation built through the 14-Day Pivot Method: brand, priced offer, launch page copy, website PRD, outreach assets, operating runway, and go-to-market timeline.
2. **How to get the most value** — start with the executive summary, click the launch timeline, use the "Ask this venture" tool for questions, and walk the assets in order.
3. **What happens next** — reply to the email or book the kickoff call; the team can build it, or the founder can take it and run.

## UI/UX details

- Use the existing dark editorial theme (`theme-dark-scope`) and `Dialog`/`Sheet` components (desktop dialog, mobile sheet).
- Show the founder's logo, venture name, and one-liner at the top of the modal so it feels like Adam is speaking directly about *this* startup.
- Two CTAs: primary "Book the kickoff call" (links to `/v/:token/engage` or scheduling), secondary "Reply to Adam" (mailto with the showcase URL in the body).
- A "Don't show this again" checkbox and a plain "Close" option.
- Respect reduced motion and trap focus inside the modal.

## Technical implementation

- New file: `src/components/share/ShareWelcomeModal.tsx`
  - Props: `open`, `onOpenChange`, `payload` (SharePayload), `token`.
  - Dismissal state via `localStorage` key `share-welcome:${token}`.
- Edit `src/routes/v.$token.tsx`:
  - Add `welcomeOpen` state.
  - After the payload loads, open the welcome modal automatically if the token has not been dismissed.
  - Pass a `onShowWelcome` toggle into the masthead or sidebar for the refresher helper.
- Keep the modal out of the reading pane so it does not interfere with asset scrolling or swipe navigation.
- No new edge functions or database changes required; the existing share payload provides all the data.

## Open item

Confirm the booking destination for the primary CTA:
- Option A: Link to the existing `/v/:token/engage` page (current price + intake flow).
- Option B: Link directly to an external scheduling URL (e.g., Calendly) if one exists.

The default implementation will use Option A (`/v/:token/engage`) and keep the URL configurable in a single constant.

## Verification

- Open a fresh showcase link in an incognito window; the modal should appear centered over the showcase.
- Dismiss it, reload, and confirm it does not reappear.
- Confirm the venture name and logo render correctly.
- Tap the primary CTA and verify it navigates to `/v/:token/engage`.
- Confirm mobile renders as a bottom sheet and does not block the masthead.
