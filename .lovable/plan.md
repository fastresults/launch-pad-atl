## The fix

"Start your thing" reads like a text message. For a nurse or teacher betting $197 on a Saturday morning, it undersells the moment. We need warmth without slang — plain English that respects the reader's ambition.

## Word swap

Replace **"thing"** (as a stand-in for the business) with one of these, chosen per context:

- **"your business"** — the default. Concrete, warm, no jargon.
- **"your side income"** — when the context is Plan B / evenings-and-weekends.
- **"your shop / your store"** — when the reader is Main Street or e-commerce specific.
- **"the business you've been talking about"** — for the emotional beat (hero sub, one section only, not repeated).

## Where it changes

1. **`src/routes/index.tsx`** — meta title/description: "Start your side hustle" → "Start your business in one morning."
2. **`src/components/home/HomeFramework.tsx`** — hero H1 currently "Start your thing. Get your first paying customer in two weeks." → **"Start your business. Get your first paying customer in two weeks."** Sweep any other "your thing" uses in old-way/new-way, walk-out, and facilitator copy.
3. **`src/components/home/AccessModeDialog.tsx`** — sub-copy that references "your thing" (if present after Pass 1) → "your business."
4. **`.lovable/plan.md`** — update the voice brief so "thing" moves out of the lead-word list and "business / side income / your shop" moves in, so Passes 2–5 inherit the corrected voice.

## What doesn't change

- "Startup" stays as the category word per project memory (we still call the company Startuplabs and refer to "your startup" where it fits editorially).
- No layout, price, date, or structural changes. Copy only.
- Brand-name policy unchanged: "The 14-Day Pivot Method" mentioned once per page, low in the fold.

## Voice check — before / after

- Before: *Start your thing. Get your first paying customer in two weeks.*
- After: **Start your business. Get your first paying customer in two weeks.**

- Before: *…build the real thing — your side hustle, your shop, your online store…*
- After: **…build the real business — your side income, your shop, your online store…**

Say **proceed** and I'll sweep Pass 1 files, then continue Pass 2 with the corrected voice.
