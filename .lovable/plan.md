# Copy pass 3 — one name only: The 14-Day Pivot Method. Adam dialed back.

## Reframe

One brand across the entire site. The 14-Day Launch Method is retired from all user-facing copy.

- **The 14-Day Pivot Method** — the *only* branded name. Used everywhere Launch Method appears today: eyebrows, H1s, buttons, meta titles, agendas, pricing lines, dialog headers, concierge intro.
- **Adam** — the operator who built the method. Named once in the hero, once on the facilitator card, once in the done-for-you dialog card (that mode literally means he does it), plus his standalone facilitator page. Elsewhere: cut, or replaced with "the operator," "the facilitator," "our team," or dropped entirely.

Rule of thumb: the method is the credibility; Adam is the proof point under the poster.

Note on code identifiers: `SPRINT_METHOD_LABEL` in `src/lib/framework-deliverables.ts` is a code constant — retype its *value* to "14-Day Pivot Method" but keep the identifier name.

## Site-wide replacement

Every user-facing string containing "The 14-Day Launch Method" or "14-Day Launch Method" is rewritten to "The 14-Day Pivot Method" / "14-Day Pivot Method." This is a global sweep.

Files and lines affected:

- `src/components/home/HomeFramework.tsx` — lines 74, 79, 180, 350 (plus body edits below)
- `src/components/home/AccessModeDialog.tsx` — lines 31, 42, 53, 81
- `src/components/register/RegisterFramework.tsx` — lines 63, 65, 67
- `src/components/facilitator/FacilitatorHero.tsx` — lines 32, 42
- `src/components/facilitator/FacilitatorCTA.tsx` — lines 14, 18
- `src/components/site/AskConcierge.tsx` — line 332
- `src/routes/webinar.tsx` — lines 9, 19, 22, 33, 36
- `src/routes/build.tsx` — lines 17, 24, 102
- `src/routes/build.$slug.tsx` — line 280
- `src/routes/schedule.tsx` — lines 49, 58
- `src/routes/services.tsx` — lines 41, 48, 269, 296
- `src/routes/one-on-one.tsx` — lines 67, 70, 82
- `src/lib/hub-dashboard-copy.ts` — line 17 eyebrow
- `src/lib/framework-deliverables.ts` — line 68 value only (keep constant name)
- `src/lib/chatbot-knowledge.ts` — lines 68, 70, 84, 90, 100, 199–207 (rewrite the vocabulary block so it names only The 14-Day Pivot Method; remove the offer-vs-process distinction)

## Additional body-copy rewrites (Pivot Method as anchor, Adam pulled back)

### 1. `src/components/home/HomeFramework.tsx`

**Hero paragraph (line 100):**
Before: One focused morning. A done-with-you playbook quietly replacing accelerators, courses, and raw AI. …run live by Adam, the operator who built it…
After: One focused morning of **The 14-Day Pivot Method** — the done-with-you system quietly replacing accelerators, courses, and raw AI. The way modern founders skip the year of guessing and land their first paying customer in two weeks. Built and run by Adam, the operator behind the method. $297 once, yours forever. Full support during and after, if you want it.

**New-way card (line 94):**
Before: One live morning in the room with Adam. Revenue in two weeks.
After: One live morning of **The 14-Day Pivot Method**. Revenue in two weeks.

**Modes CTA (line 123):**
Before: Prefer to do it live — or have Adam's team build it for you?
After: Prefer to do it live on Zoom — or have it built for you?

**Framework H2 (line 184):**
Before: A business ready to take money. Built with Adam in one morning.
After: A business ready to take money. Built with **The 14-Day Pivot Method** in one morning.

**Framework intro (line 187):**
Before: Raw AI hands you a folder of documents. An accelerator hands you a year of homework. This hands you a business…
After: Raw AI hands you a folder of documents. An accelerator hands you a year of homework. **The 14-Day Pivot Method** hands you a business — offer priced, first customer named, first channel open, outreach going out that afternoon.

**HonestRoadmap included list (lines 246–247):**
- "A 90-day roadmap …, built with Adam for your business" → "…built on the Pivot Method for your startup"
- "Working time in a 20-seat room with Adam himself — not a moderator, not a TA" → "Working time in a 20-seat room with the operator who built the method — not a moderator, not a TA"

**HonestRoadmap paragraph (line 262):**
Before: The workshop flips it. Adam sits with you, prices your offer, opens your first channel…
After: The workshop flips it. **The 14-Day Pivot Method** prices your offer, names your first customer, opens your first channel, and gets you selling in the next 14 days.

**Build-layer paragraph (line 309):**
Before: …Each is a half-day working session with Adam. Or hand the whole thing to his team.
After: …Each is a half-day working session that extends the Pivot Method. Or hand the whole thing to our team.

**Build-layer closing (line 350):**
Before: …the same playbook Adam's team runs from — the working sessions that extend The 14-Day Launch Method…
After: …the same playbook our team runs from — the working sessions that extend **The 14-Day Pivot Method** after your first customer.

**Final CTA line (line 508):**
Before: $297 gets you in the room with Adam and a real plan your startup can run with Monday.
After: $297 gets you one morning of the Pivot Method and a real plan your startup can run with Monday.

### 2. `src/routes/build.tsx` line 24
Before: …eight half-day working sessions with Adam — $197 each — extending the done-with-you method behind The 14-Day Launch Method… Ship each one yourself with Adam in the room, or hand it to the team…
After: …eight half-day working sessions — $197 each — extending **The 14-Day Pivot Method** after your launch… Ship each one yourself in the room, or hand it to the team…
(Keep Adam in the eyebrow — line 17 becomes "The 14-Day Pivot Method · 8 Working Sessions with Adam.")

### 3. `src/routes/webinar.tsx`
- Line 11 highlight: "Small cohort so Adam works your business, not a Zoom crowd" → "Small cohort so the method gets applied to your startup, not a Zoom crowd"
- Line 42 body: "One focused morning with Adam." → "One focused morning of the Pivot Method."

### 4. `src/routes/services.tsx`
- Line 41 eyebrow: "…Adam's team builds what comes next" → "…Our team builds what comes next"
- Line 48 body: "The new way is Adam's team running the same done-with-you method behind The 14-Day Launch Method…" → "The new way is our team running **The 14-Day Pivot Method** at scale…"
- Keep Adam on the facilitator card at lines 217/222 (photo + name credit).

### 5. `src/routes/schedule.tsx` line 274
Before: …worked out with Adam, not generated by a bot.
After: …worked out with the operator, not generated by a bot.

### 6. `src/routes/one-on-one.tsx`
This page's whole premise is done-for-you — Adam earns most of his mentions here. Only trim:
- Line 92: "You stay founder. Adam's team ships it." → "You stay founder. Our team ships it."
- Keep line 260 scarcity claim as-is.

### 7. `src/components/home/AccessModeDialog.tsx`
Beyond the name swap, leave the Adam mentions — this dialog is literally about *who* runs it, so his name is load-bearing per card.

## Chatbot / concierge vocabulary — `src/lib/chatbot-knowledge.ts`

Rewrite the vocabulary block so it names only **The 14-Day Pivot Method**:

- Remove every "The 14-Day Launch Method" reference (lines 68, 70, 84, 90, 100, 200, 207).
- Remove the offer-vs-process distinction (lines 199–207) — collapse to a single entry: *"The 14-Day Pivot Method — the done-with-you method replacing accelerators, courses, and raw AI. One focused morning, live with Adam. Two weeks to first revenue. Use this name in every reference."*

## Code constant

`src/lib/framework-deliverables.ts` line 68:
```ts
export const SPRINT_METHOD_LABEL = "14-Day Pivot Method";
```
Value only. Identifier stays `SPRINT_METHOD_LABEL` so no imports break.

## Out of scope

- No layout, structure, price, date, or CTA changes.
- No changes to routes/URLs.
- No changes to `src/lib/launch-14day-plan.ts` filename or the `14-Day Sprint` dashboard label (that's the internal delivery-tracker term, not the offer name).

## Verification

- `rg -n "Launch Method" src/ public/` → zero user-facing hits. Only acceptable remaining match is the `SPRINT_METHOD_LABEL` identifier name (its string value is now "14-Day Pivot Method").
- `rg -c "Pivot Method" src/components/home/HomeFramework.tsx` → ~5–6.
- `rg -c "\bAdam\b" src/components/home/HomeFramework.tsx` → drops from 13 to ~4 (hero credit + dialog CTA area + facilitator card block).
- Read the homepage top-to-bottom out loud: method as protagonist, Adam as credit line.
