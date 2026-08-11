# End-of-showcase "next step" modal

When a viewer reaches the bottom of a client preview link (`/v/:token`), a single cinematic modal appears once, inviting them to move from draft to build — with Adam's direct line.

## What the viewer sees

- A wide modal (max ~880px) built as a two-panel composition:
  - Full-bleed background image: a founder's startup team in a warm, natural-light workspace, shot editorial-style, with Adam standing at the right of frame. The left ~55% is intentionally open, low-contrast space so the message sits cleanly over it.
  - A soft gradient scrim over the copy zone so the text stays legible regardless of theme.
- Copy (lightly polished for grammar, meaning unchanged):
  > **Your foundation is drafted. Now build it.**
  >
  > With your foundation draft in place, the next step is to carefully review every section, polish the creative treatments, and begin constructing and operationalizing your startup. This is where you take a hard look at your internal resources and your go-to-market actions.
  >
  > Alternatively, you can retain Adam and his team as your backfield in motion.
  >
  > For an operational consultation, contact Adam Anderson at **929-234-7355**.
- Actions: primary `Call 929-234-7355` (tel: link), secondary `Keep reviewing` (closes).
- Appears once per viewer per share (remembered in local storage keyed by share token), only after they actually reach the bottom — not on a timer.
- Mobile: the image collapses to a top band with the copy beneath, full-height sheet, safe-area padding, and thumb-reachable buttons above the existing bottom nav.

## Technical details

- New asset generated into `src/assets/` (landscape ~1920x1080, JPG): editorial team-in-workspace photograph with Adam at right, deliberate negative space at left.
- New component `src/components/share/ShareOutroDialog.tsx` — shadcn `Dialog` on desktop, `Sheet` (side="bottom") on mobile via the existing `useIsMobile` hook, matching the patterns already used in `v.$token.tsx`.
- Trigger in `src/routes/v.$token.tsx`: an `IntersectionObserver` on a sentinel div rendered after the last `ShareSection` in the reading pane; fires when it's been visible and the viewer has scrolled past ~90% of the document. Guarded by `localStorage` key `sl-share-outro:<token>` so it never nags twice.
- Mobile reader path (`MobileReader`) uses the same sentinel at the end of the last section so behaviour matches.
- Presentation only — no payload, edge function, or schema changes. The modal is shown to all viewers, including the owner previewing their own link.
