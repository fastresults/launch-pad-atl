# Scope-truth pass 2 — every promise surface, line by line

## Why the first pass missed this

Pass 1 rewrote exactly one field per workshop: the `walkOuts` array. It never opened the other seven fields that make the same promise, and where it did rewrite, it swapped one finished-system verb for another ("picked and set up" → "stood up with your pipeline built"). Net effect: the audit doc says CRM was tightened, while the page still says the CRM is live, the sequence is sending by Monday, and the automations run while you're on a job.

This pass is not a wording touch-up. It is a full inventory of every string on every surface that states an outcome, graded against one rule, with a grep gate at the end so it cannot silently drift back.

## The rule

Every outcome claim must be exactly one of three shapes, and must read as that shape:

1. **Decided** — a choice made and written down, with the reasoning that killed the alternatives.
2. **Drafted** — the first real version of one named artifact, made in the room.
3. **Configured** — one setting or object created in a tool the attendee already controls and can show on screen.

Banned in outcome copy, on every surface: live, sending, sent, shipped, running, runs, wired, stood up, flowing, reconciled, filed/filing, integrated, automated, loaded, launched, "before you leave", "by Monday", "on autopilot", "without you" — plus counted volume ("3 sequences", "five automations", "30 days of content", "10 assets") and anything gated on DNS propagation, vendor approval, account access we do not hold, or a licensed professional.

**Permitted uses of the same words** (these stay, they describe the event, not the outcome): "the live morning" as a format name, "live critique", "live wireframing", "working session … in the room", and the Foundation lane's "your live page", which pass 1 graded KEEP and the user has not disputed.

## Inventory — every line that changes

### `src/lib/workshop-products.ts` (artifact previews, decision copy, objections)

| Line | Current | Fix |
| --- | --- | --- |
| 241 | stamp "Loaded into your CRM in the room · sending by Monday" | "Drafted with you in the room · yours to load and send" |
| 257 | "Leave with the follow-up running without you." | "Leave knowing exactly what gets sent, when, and by what trigger." |
| 259 | "CRM live, pipeline mirrored, your welcome sequence written and sending, and the automations that run it while you're on a job." | CRM chosen and opened, pipeline stages defined, welcome sequence drafted, automation map written with the build steps |
| 278 | stamp "Scheduled before you leave · 30 days of nothing to think about" | first week drafted and slotted, rest of the month outlined |
| 352 | stamp "Built live, running on your account before you leave" | one workflow configured on your account, the rest specified |
| 357 | "tools you already have, wired together in the room" | "connected step by step with you at the keyboard" |
| 368 | "Leave with five workflows running without you." | one working automation plus four specified |
| 370 | "five real automations built live on your accounts" | same correction, volume claim removed |
| 387 | "Books: chart of accounts live, receipts flowing, first month closed" | chart of accounts drafted, receipt intake chosen, close rhythm scheduled |
| 389 | stamp "Filed and opened in the room · nothing left on the list" | prepared with you · the filings stay yours to submit |
| 407 | "filing ready to submit, contract suite ready to sign, accounts open, books actually started" | entity path compared against your numbers, contract checklist assembled, accounts and books set to open |
| 313 | "Pillar → 3 supporting posts each, first draft written in the room" | drop the multiplied count, keep the first draft |

### `src/lib/workshop-audit.ts` (the promise on each audit intake)

Every `promise` string ends with "before you leave" and most assert a finished system. All nine rewritten under the rule:

| Line | Fix |
| --- | --- |
| 54 | generic promise — "the one named artifact your audit prescribed, made with you and yours to keep" |
| 71 | brand system chosen and applied to one flagship surface, the other two specified |
| 86 | booking page rewritten — headline, proof, price, button — ready for you to publish |
| 101 | Foundation: keep the sent-first-message claim (the founder sends it in the room; this is the benchmark line) |
| 116 | follow-up sequence written and staged in your own tool, ready for you to turn on |
| 131 | channel chosen, rhythm set, first week of posts drafted and slotted |
| 146 | buyer-question list plus the first piece drafted, ready to publish |
| 161 | highest-value time sink configured on your own account, the next two specified |
| 176 | entity comparison against your numbers with the questions for your CPA, contract checklist, books set to open |

### `src/lib/build-workshops.ts` (one-liners, subheads, walk-outs, agenda outputs, comparisons, "by 11:30" paragraphs)

Per lane, the fields corrected:

- **Brand identity** — line 138 agenda output, 157 agency tagline ("shipped live in 2 weeks" is agency service copy: allowed to stay, it is not the morning).
- **Website** — 197 subhead ("wire your site for revenue … events live"), 243 agenda output, 265 comparison lead ("Two pages wired for revenue").
- **Social** — 294 oneLiner ("30 days of content before you leave the room"), 313, 330, 334, 356, 366 ("30-day calendar shipped"), 373.
- **Content engine** — 394 oneLiner ("Your content machine is live"), 415, 430, 476 ("90-day calendar already loaded").
- **AI OS** — 496 subhead ("automate five of them live"), 513, 528/530 agenda ("5 working flows you can deploy this week"), 561, 566, 579 "by 11:30" paragraph.
- **CRM** — 594 oneLiner, 596 subhead, 612 (the flagged line), 614, 617, 634 agenda title, 656 comparison, 661 lead, 676 ("running on autopilot by Friday"), 679 "by 11:30" paragraph.
- **Sales** — 730 agenda output (already close; verified against the rule).
- **Accounting** — 796 subhead ("set up the books"), 817, 842 agenda output ("automated reminders"), 880 "by 11:30" paragraph.
- **Foundation** — audited and untouched, except confirming no drift.

The flagged CRM line becomes: *"Your CRM chosen — Hubspot, Attio, or Folk — scored against your stage and team, with your pipeline stages defined and the setup steps listed."*

### Modal surfaces

- `supabase/functions/atlanta-viability/index.ts` — SCOPE TRUTH currently bans "finished / launched / integrated" only. Add the explicit banned-verb list above, the ban on counted volume, and the ban on "before you leave" / day-name deadlines, in both the main prompt (line 67) and the repair prompt (line 127).
- `src/components/home/IdeaSnapshotModal.tsx` — lines 512 and 517 carry the Foundation live-page claim. Foundation is the benchmark and stays, but the "where account access allows" qualifier is applied consistently in both places.

## Verification gate

After the rewrite, run a ripgrep over `src/lib/build-workshops.ts`, `workshop-products.ts`, `workshop-audit.ts`, `workshop-catalog.ts`, `IdeaSnapshotModal.tsx`, and the edge function for the banned-verb list. Every remaining hit must fall into the documented permitted set (event-format "live", Foundation's live page, agency-service taglines) — and each permitted hit is listed by line in the audit doc so the next pass can tell allowed from leaked at a glance.

## Documentation

`.lovable/walkout-audit.md` gets a "Pass 2" section: the rule, the banned list, the permitted exceptions with line references, the full change table above, and a note on why pass 1 was insufficient (single-field scope, verb substitution instead of scope reduction).

## Scope

Copy only — no components, layout, schema, routes, or logic. The morning stays 8:45–11:30 (2h45); if it should be described as a strict 2 hours, that is a separate change to agendas and schedule.
