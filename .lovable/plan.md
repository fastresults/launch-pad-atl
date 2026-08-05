# Walk-out audit: can a morning actually produce this?

Every "What you walk out with" list on the site comes from one place — the `walkOuts` array per workshop (Foundation is authored by hand, the eight build workshops each carry six items). The homepage workshop stack and the `/build/:slug` page both read that same array, so fixing it once fixes both surfaces.

The working window is 8:45–11:30 — roughly 2h45m of real build time in four blocks, with AI doing the drafting and the room doing the deciding. The test for every line: **could an attendee, with an operator across the table and AI drafting, leave with this finished at a quality they'd actually use?**

## What the audit found

Across the 52 items, three patterns repeat:

1. **Volume claims that can't be produced at quality in one morning.** 16 emails written live, 20+ posts, a 30+ hook bank, 5 workflows automated live, 3 logo directions. AI can emit that volume; it can't be reviewed, corrected to the founder's voice, and made usable in the time available. These read impressive and then underdeliver in the room.
2. **Claims that depend on systems we don't control.** "Conversion events wired live to GA4 and your CRM (you'll see the first event fire)", "CRM picked and set up", deliverability records (SPF/DKIM/DMARC). These require account access, DNS, and propagation time. When they don't land, the whole list loses credibility.
3. **Advice framed as a professional deliverable.** "Entity decision in writing with the tax math", "insurance and compliance checklist tailored to your industry". This is the highest-risk line on the site: we're not the attendee's attorney or CPA, and stating it as a decision invites reliance we can't back.

The rest are honest and should not be touched — Foundation's four lines are the model for the whole site: named artifact, real scope, no inflation.

## How each item gets fixed

Every flagged item is rewritten with the same three moves, so perceived value goes **up** while the promise gets smaller:

- **Name the artifact, not the volume.** "3 sequences, 16 emails" becomes "your welcome sequence written and loaded — the other two mapped and templated." One finished thing beats three claimed ones.
- **Split "built live" from "ready to run."** Each list gets a clear line between what is finished in the room and what leaves as a decided, drafted, ready-to-execute piece. Nothing quietly implies "done" when it means "planned."
- **Show the working artifact.** Where we drop volume, we add specificity that only a real working session produces — the actual decision made, in writing, with the reasoning. That's the thing AI alone doesn't hand them.

### Per workshop

- **Foundation** — no change. It is the benchmark.
- **Brand identity** — logo directions reframed from "3 finished directions" to one chosen direction plus the rationale that kills the others; mood board scoped to a reference set, not a designer-ready package.
- **Website** — GA4/CRM wiring reframed to the event plan written and the single primary conversion event configured; the 30-item QA checklist stays (it's a checklist, it's real).
- **Social** — 20+ posts becomes a first week written and shipped plus the calendar slotted for the rest; hook bank scoped to a usable count tied to their pillars.
- **Content engine** — keyword map scoped to the terms confirmed in the room; the "one anchor into 10 assets" claim becomes one anchor piece repurposed live with the flow documented for the rest.
- **AI operating system** — "5 workflows automated live" becomes the highest-value workflow built and running in front of them, with the next four specified and prompted.
- **CRM** — CRM chosen and the account stood up with the first pipeline and one live sequence; deliverability becomes a records checklist with the values ready to paste, not "configured."
- **Sales** — largely honest already; the objection bank's "tested against real deals" claim is softened to what the room can actually verify.
- **Accounting** — reframed from decisions to a prepared position: your entity comparison and the questions your CPA or attorney needs answered, so the professional conversation takes 20 minutes instead of two hours. Add a short standing line that we build the operating setup, not legal or tax advice.

## Also checked for consistency

The agenda blocks, the artifact preview mock, and the decision copy on each workshop repeat some of the same claims. Any line changed in the walk-out list gets matched in those three places so the page never promises in one section what it walks back in another.

## Technical notes

- `src/lib/build-workshops.ts` — `walkOuts` for the eight build workshops; also `agenda` and `sections` copy where claims repeat.
- `src/lib/workshop-catalog.ts` — Foundation's `walkOuts` (unchanged).
- `src/lib/workshop-products.ts` — `PRODUCT_META` artifact previews and decision copy per slug.
- No component or layout changes; copy-only edits to data files.
- Output: the audit table (every item, verdict, rewrite) written to `.lovable/walkout-audit.md` alongside the code changes, so you can review the reasoning line by line.
