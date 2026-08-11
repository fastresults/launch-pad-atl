# Operationalize: from foundation to a running business

Today the "Operationalize" item in the showcase sidebar opens the consultation modal. That's a sales prompt, not an answer. Replace it with a real destination: an **Operating Runway** — a sequenced checklist and workflow the founder works through after receiving the foundation. The consultation offer stays, but it sits at the end as the "or have Adam's team run this" option.

## The arc: the Launch Cadence, continued

The showcase already tells the founder a 14-day story — the Launch Cadence (`LAUNCH_14DAY_PLAN`), Day 1 "Lock the concept" through Day 14 "Launch day + proof + growth loops". The runway does not invent a second story. It uses the same arc, same day numbers, same themes and "done when" lines, and then extends it past Day 14 into the part nobody covers: actually running the business.

```text
Days 1–7   Week 1 — Prove it      (concept, offer, buyers, demand, wedge, sales machine, voice)
Days 8–14  Week 2 — Wire it       (legal, money, domain, site, ops, content, launch)
Days 15–30 Week 3–4 — Run it      (post-launch: the operating system)
Days 31–90 Quarter 1 — Compound   (rhythm, proof, first hire, first close)
```

**Phase 1 — Week 1 · Prove it (Days 1–7).** Straight from the cadence, one checklist row per day, carrying that day's theme, objective and `doneWhen` verbatim, with the day's `assetKeys` resolved into link chips to the assets already sitting in this showcase. Founder checks a day off only when the `doneWhen` is literally true — e.g. Day 4 is not done until a paid deposit or five written commitments exist.

**Phase 2 — Week 2 · Wire it (Days 8–14).** Same treatment, and this is where the operational spine lands: entity + ToS/Privacy/Refund + insurance (Day 8), Stripe + business bank + books (Day 9), domain/email/GA4 (Day 10), site + brand pack (Day 11), fulfillment SOP + support bot + automations (Day 12), content calendar + operating cadence (Day 13), ads + reviews + referral + first paying customer (Day 14).

Because the cadence gives the *theme* but not the *administrative reality*, each of these days expands into sub-steps the founder can tick individually — this is the detail the shareable link is missing today:

- Day 8 → entity filed · EIN issued · registered agent · operating agreement signed · MSA / services agreement + SOW template · NDA · contractor agreement · ToS + Privacy live on the site · GL insurance bound (E&O or trades rider where applicable). Sent-for-signature and returned are separate ticks — a contract that went out is not a contract that came back.
- Day 9 → business bank + card opened · personal spend separated · payment processor live with a real test charge · chart of accounts set · bank feed connected · sales-tax posture decided · bookkeeping cadence named (weekly reconcile, monthly close, who does it)
- Day 10 → domain + DNS · business email · GA4 + pixels firing real events · email marketing sender authenticated (SPF/DKIM)
- Day 12 → CRM pipeline stages with one owner per stage · proposal template built from the priced offer · e-sign tool connected · invoicing + deposit + late-payment terms · onboarding kit (welcome email, kickoff agenda, asset request list) · delivery SOP
- Day 13 → three lead sources chosen with a weekly quota each · outbound list built and the first 25 messages actually sent · 5-touch follow-up sequence scheduled · booking link wired into the CRM

**Phase 3 — Days 15–30 · Run it.** The first orders arrive and the system either holds or it doesn't: first 10 proposals out the door, close-rate tracked, cash-collected vs. invoiced reconciled, first monthly close completed with an accountant's eyes on it, support inbox with a response-time promise, testimonial captured from customer #1.

**Phase 4 — Days 31–90 · Compound.** Weekly operating rhythm installed (Monday pipeline review, Friday five numbers, monthly close), one dashboard with CAC / close rate / cash on hand / pipeline value / MRR-or-backlog, content cadence sustained from the brand kit, pricing revisited against real win/loss, first hire or contractor scoped with a 30-day scorecard, and a quarterly plan written for Q2.

Every row carries: the day or window it belongs to, why it matters in one line, what "done" looks like, an owner field, and link chips into the showcase assets that already answer it. Phases 1–2 are generated from `LAUNCH_14DAY_PLAN` so the runway can never drift from the timeline the founder already saw; Phases 3–4 are the new post-launch extension.


## What the viewer sees

- Clicking **Operationalize** in the sidebar (desktop) or bottom nav (mobile) opens a full reading-pane view — not a modal.
- Header: "Your foundation is drafted. Here's what turns it into a business." Progress ring: *x of 22 complete*, plus a per-wave bar.
- Three collapsible waves; each item is a checkbox row with the one-line why, a "done means…" hint, an optional owner/date, and a link chip to the related asset when one exists.
- Checking items persists locally per share token, so a founder can come back to it. Progress never leaves their browser (no login on a share link).
- Sticky footer bar: **Request an operations consultation** (opens the existing modal with the form) and **Call 929-234-7355**. The modal is also still reachable, just never auto-opened.
- Export: the runway exports to PDF/Word through the existing section export menu, with checked state included.

## Technical details

- New `src/components/share/OperateRunway.tsx` — presentational; takes the payload so it can resolve asset links, and a `token` for progress storage.
- New `src/components/share/operate-runway.ts` — builds Phases 1–2 by mapping over `LAUNCH_14DAY_PLAN` from `src/lib/launch-14day-plan.ts` (day, theme, objective, `doneWhen`, `assetKeys`, `category` dot from `CATEGORY_DOT`), attaches the per-day sub-steps as a keyed `SUBSTEPS: Record<number, Substep[]>`, and declares Phases 3–4 as a typed `POST_LAUNCH` constant. Pure data + pure functions (progress math, `assetKeyFor`), unit-tested alongside `preview-copy.test.ts` — including a test that every `LAUNCH_14DAY_PLAN` day appears exactly once.
- Asset link chips resolve `assetKeys` against the share payload's items; unknown keys are silently skipped, matching the existing timeline behaviour.
- Category dots reuse `CATEGORY_DOT` so the runway is visually continuous with the Launch Cadence view (`TIMELINE_KEY`) rather than a separate design language.
- `src/routes/v.$token.tsx`: in `goTo`, remove both the `OUTRO_KEY → setOutroOpen(true)` branch and the "operations section opens the modal" side effect. `OUTRO_KEY` becomes a normal active key that renders `<OperateRunway />` in place of `<ShareSection />`, same as `BRAIN_KEY`/`TIMELINE_KEY` are special-cased today. A day row can deep-link into the timeline via the existing `goTo(TIMELINE_KEY, step)` signature.
- `src/components/share/MobileReader.tsx`: same special-case so the phone path matches.
- `ShareSidebar.tsx`: keep `OUTRO_KEY` pinned, relabel hint to "After launch: the 90-day runway" and swap the icon to a checklist glyph.
- `ShareOutroDialog.tsx` is unchanged and reused — opened only from the runway's footer button.
- Progress: `localStorage` key `sl-operate:<token>` holding `{ [stepId]: { done, owner?, due? } }`, where `stepId` is `day-8` / `day-8.ein` / `post-30.first-close` so sub-steps roll up into their day.
- Entity/legal sub-steps respect `resolveEntityState` where the venture already has legal setup progress, so a founder who has formed already sees those rows pre-checked rather than being told to do it again.
- Export: reuse `share-export.ts` by feeding the runway a markdown serialization of its current state (phase headings, day numbers, checked state).

## Not included

Nothing is written back to the database and no email fires on checkbox changes. Say the word if you'd rather have the runway state stored per venture so it shows up in the founder's dashboard too — that's a table plus RLS and a natural second step.
