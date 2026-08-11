# Operationalize: from foundation to a running business

Today the "Operationalize" item in the showcase sidebar opens the consultation modal. That's a sales prompt, not an answer. Replace it with a real destination: an **Operating Runway** — a sequenced checklist and workflow the founder works through after receiving the foundation. The consultation offer stays, but it sits at the end as the "or have Adam's team run this" option.

## The recommendation: 6 tracks, 3 waves, 90 days

The foundation answers *what the business is*. The runway answers *what makes it transact*. Everything below is ordered by what blocks revenue soonest.

**Wave 1 — Legal + Money (Days 1–14). Nothing else is safe until this is done.**
1. Entity formed and confirmed (state, registered agent, filing receipt saved)
2. EIN issued
3. Business bank account + card opened, personal spend separated
4. Accounting system live (chart of accounts, bank feed connected, sales tax posture set)
5. Bookkeeping cadence chosen (weekly reconcile, monthly close, who does it)
6. Insurance quoted and bound (general liability; E&O or trades-specific as applicable)
7. Core legal pack sent for signature and returned: operating agreement, client services agreement / MSA, statement of work template, NDA, contractor agreement, privacy policy + terms for the site

**Wave 2 — Sell (Days 10–45). This is where the money actually starts.**
8. Offer and price locked from the pricing framework — one flagship offer, written as a page
9. Proposal template built from the offer (scope, price, terms, signature block) + e-sign tool
10. Invoicing and payments live (payment processor, deposit terms, late policy)
11. CRM stood up: pipeline stages, required fields, one owner per stage
12. Lead sources chosen (3 max) with a weekly quota per source
13. Outbound list built and the first 25 messages actually sent
14. Booking link + intake form wired to the CRM
15. Follow-up sequence written (5 touches) and scheduled

**Wave 3 — Run (Days 30–90). What makes it repeatable instead of heroic.**
16. Website / landing page live with the offer, proof, and one call to action
17. Analytics + call tracking installed; one dashboard, five numbers
18. Content cadence started from the brand kit (channel, format, weekly slot)
19. Delivery SOP written: what the client gets, in what order, by when
20. Onboarding kit: welcome email, kickoff agenda, asset request list
21. First hire or contractor scoped (role, pay, first 30-day scorecard)
22. Weekly operating rhythm: Monday pipeline review, Friday numbers, monthly close

Each item carries: why it matters in one line, what "done" looks like, an owner field, and a due-by day offset. Items link to the asset in the showcase that already answers it (pricing strategy → item 8, operations plan → item 19, brand kit → item 18), so the checklist feels like the foundation coming alive instead of new homework.

## What the viewer sees

- Clicking **Operationalize** in the sidebar (desktop) or bottom nav (mobile) opens a full reading-pane view — not a modal.
- Header: "Your foundation is drafted. Here's what turns it into a business." Progress ring: *x of 22 complete*, plus a per-wave bar.
- Three collapsible waves; each item is a checkbox row with the one-line why, a "done means…" hint, an optional owner/date, and a link chip to the related asset when one exists.
- Checking items persists locally per share token, so a founder can come back to it. Progress never leaves their browser (no login on a share link).
- Sticky footer bar: **Request an operations consultation** (opens the existing modal with the form) and **Call 929-234-7355**. The modal is also still reachable, just never auto-opened.
- Export: the runway exports to PDF/Word through the existing section export menu, with checked state included.

## Technical details

- New `src/components/share/OperateRunway.tsx` — presentational; takes the payload so it can resolve asset links, and a `token` for progress storage.
- New `src/components/share/operate-runway.ts` — the track/wave/item data as a typed constant, plus `assetKeyFor(item)` mapping items to showcase asset keys, and small helpers for progress math. Pure data + pure functions, unit-testable alongside `preview-copy.test.ts`.
- `src/routes/v.$token.tsx`: in `goTo`, remove both the `OUTRO_KEY → setOutroOpen(true)` branch and the "operations section opens the modal" side effect. `OUTRO_KEY` becomes a normal active key that renders `<OperateRunway />` in place of `<ShareSection />`, same as `BRAIN_KEY`/`TIMELINE_KEY` are special-cased today.
- `src/components/share/MobileReader.tsx`: same special-case so the phone path matches.
- `ShareSidebar.tsx`: keep `OUTRO_KEY` pinned, relabel hint to "22 steps to launch" and swap the icon to a checklist glyph.
- `ShareOutroDialog.tsx` is unchanged and reused — opened only from the runway's footer button.
- Progress: `localStorage` key `sl-operate:<token>` holding `{ [itemId]: { done, owner?, due? } }`. No schema changes.
- Entity/legal items respect `resolveEntityState` where the venture already has legal setup progress, so a founder who has formed already sees those rows pre-checked rather than being told to do it again.
- Export: reuse `share-export.ts` by feeding the runway a markdown serialization of its current state.

## Not included

Nothing is written back to the database and no email fires on checkbox changes. Say the word if you'd rather have the runway state stored per venture so it shows up in the founder's dashboard too — that's a table plus RLS and a natural second step.
