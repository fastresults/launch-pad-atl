## Two passes, one turn

### Pass A — Adam Anderson as serial entrepreneur (unchanged from prior plan)

`src/routes/index.tsx`:

1. **`FACILITATOR_TITLE`** (lines 10–11) → "Serial entrepreneur · Co-Founder, OPEN Interactive · Has helped launch dozens of modern-economy businesses across tech, services, and Main Street."
2. **Card kicker over Adam's name** (lines 175–177) → "Serial Entrepreneur · Operator · Builder"
3. **Lead bio paragraph** (lines 196–205) → opens with "Adam is a serial entrepreneur who has personally started multiple companies and helped launch dozens more — the kind of lean, modern businesses people are actually building in 2026: online services, AI-powered shops, productized expertise, and Main Street operators…"
4. **Chips** (lines 207–210) → add "Helped launch dozens of modern businesses" as the first chip.

### Pass B — Balanced revenue / profit tone, hero down

Right now the homepage promises a *formed* business — legally on paper, with a website and a plan. What's missing is the why: attendees are coming to **make money, fast**. The tone fix is to make sure the reader sees the words **revenue, paying customers, profit, fastest path** at the moments that matter — without spraying them everywhere. Six targeted touches. No new sections, no new components.

**B1. Hero eyebrow** (line 65–66)
- Before: "One day. One founder. One real business."
- After: "One day. One founder. One real, **revenue-ready** business."

**B2. Hero H1** (lines 68–71) — keep almost as-is, swap the kicker
- Before: "Walk in with an idea. Walk out *a business owner*."
- After: "Walk in with an idea. Walk out *with a business built to earn*."

**B3. Hero body — add a closing sentence after the existing paragraph** (after line 79)
- Append: "The fastest path we know from idea to a viable, profit-ready business — in one focused day, with paying customers in the 90-day plan you take home."

**B4. FlowStrip subhead** (lines 123–126)
- Before: "Seven stages. One working day. *A business that exists by dinner.*"
- After: "Seven stages. One working day. *A business built to make money — not just one that exists.*"

**B5. WhatYouLeaveWith lead paragraph** (lines 465–469)
- Before: "Every stage makes something a printer can print, a calendar can hold, or a customer can sign. You'll leave with a stack of them, organized into four packs."
- After: "Every stage makes something a printer can print, a calendar can hold, or **a customer can pay for**. You'll leave with a stack of them, organized into four packs — every piece pointed at revenue in the first 90 days."

**B6. WhatYouLeaveWith closing line** (line 500)
- Before: "Print this list. Cross items off Monday. By Friday, you have a business."
- After: "Print this list. Cross items off Monday. By Friday, you have a business — **and your first paying customer in sight.**"

**B7. ValueByTheNumbers** (lines 508–513) — swap one stat label to surface revenue framing
- "25 prospects on your launch list" → "25 **revenue prospects** on your launch list"

**B8. BottomCTA body** (lines 613–617)
- Before: "If you've been waiting for the right week to start, this is the day you stop waiting. Bring the idea. We'll bring the operator, the room, and every template you need."
- After: "If you've been waiting for the right week to start earning, this is the day you stop waiting. Bring the idea. We'll bring the operator, the room, and every template you need to turn it into a business that actually brings in money."

### What stays the same (on purpose, to keep the tone *balanced*)

- The "What others are starting in 2026" cards already carry monthly income potential — those are the loudest revenue signal on the page; piling more "$$$" language around them would feel like a get-rich-quick pitch.
- Schedule page, register page, footer, and venue card are untouched.
- The facilitator proof grid keeps its existing copy — the revenue tone belongs in the *what you'll get* sections, not in Adam's bio.

## Files touched

- `src/routes/index.tsx` only — copy-only edits in `FACILITATOR_TITLE`, `Hero`, `FlowStrip`, `FacilitatorSection`, `WhatYouLeaveWith`, `ValueByTheNumbers`, and `BottomCTA`. No layout, no new components, no CSS.

## Verification

- Reload `/` and scan top to bottom. The words *revenue*, *paying customers*, *profit-ready*, *earn*, and *make money* should appear roughly 6–8 times total — present at every major beat, but never two sentences in a row.
- The facilitator section now leads with "Serial entrepreneur" in both the title line and the bio.
- No mention of "$10,000 to start" returns anywhere.
