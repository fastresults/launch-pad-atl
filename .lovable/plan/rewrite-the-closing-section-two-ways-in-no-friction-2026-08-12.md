# Rewrite the closing section: two ways in, no friction

Right now the Foundation Workshop ends with one door: reserve a seat in Atlanta. Anyone reading from Dallas or Denver hits a dead end. This rewrites that closing block into a confident fork — come to the room if you can, and if you can't, press one button and we build your startup remotely for $347.

## What the section becomes

**Eyebrow:** Two ways in
**Headline:** In Atlanta? Come build it in the room. Anywhere else? We'll build it with you.
**Sub:** Same morning, same team, same outcome — a named startup, a price you can say out loud, a live page, and a first message sent to someone real.

Then two side-by-side cards.

### Card A — Atlanta (primary if seats are open)
- Label: In the room · IGNITE Center, Norcross GA
- One line: If you can get to Atlanta, do this one. One morning, one seat, twenty people, and you walk out with it built.
- Price and the next session date pulled from the existing product data.
- Button: Reserve your seat — $297
- If the session is closed, this card falls back to the existing waitlist form, and the remote card becomes the primary.

### Card B — Anywhere else (the new path)
- Label: One-on-one · remote · $347
- Headline: Not in Atlanta? Press the button. We'll set your startup up for you.
- The three steps, stated as a promise:
  1. **Pick a time.** A short discovery call — 20 minutes, at a time that works for you. We learn the idea, who pays, and what you want it called.
  2. **We build it.** Our team builds your startup out while you go back to your life.
  3. **Within two business days, we walk you through it.** A second call where we hand over the finished startup, live and working, and show you exactly what to do next.
- Reassurance line: No homework, no travel, no waiting for the next cohort. The fastest path from idea to something real.
- Button: Schedule my setup — $347
- Small print under the button: Card details come after the discovery call — nothing is charged to book.

Under both cards, one closing line: Either way, you don't leave with a plan. You leave with a startup.

## What the button does

Opens an in-app booking form (a dialog, no page change, no third-party scheduler):
- Your name, email, phone
- Time zone / where you're based
- Best days and times for a 20-minute call (a short free-text line)
- One line: what you want to start

On submit it saves the request and emails the team through the existing inquiry pipeline, tagged as the one-on-one setup path so it doesn't get lost among general contact notes. Success state replaces the form with: "You're booked in. We'll confirm your call time by email within one business day — then it's discovery, build, and your walkthrough within two business days after that." Errors show inline with a retry; the form never loses what was typed.

## Scope

Foundation Workshop only. The other seven workshop sections keep their current single-CTA close.

## Technical notes

- `src/components/home/workshop/WorkshopOffer.tsx` — rewrite `WorkshopDecision` into the two-card fork. Keep the existing open/closed branch (waitlist form when `status !== "open"`), keep `nextDateLabel` for the session line, and keep the current section shell and type scale so it sits in the page rhythm.
- Copy lives in `src/lib/workshop-products.ts` as new optional fields on the foundation product (remote label, price, the three steps, CTA text) so the fork only renders for that slug; other products fall through to the existing single-CTA close.
- New `src/components/home/workshop/RemoteSetupDialog.tsx` — shadcn `Dialog` with the fields above, zod validation (name ≤100, valid email ≤255, phone ≤32, free-text ≤500), honeypot field matching the contact form's pattern.
- Submission reuses `submitInquiry` from `src/lib/inquiries.functions.ts` with a fixed subject so the notification email identifies the path — no new table, no new edge function.
- Price constant `$347` defined once alongside the product copy so it can change in one place.
- Mobile: cards stack, remote card first when the Atlanta session is closed, full-width tap targets, dialog scrolls above the sticky mobile CTA bar.
