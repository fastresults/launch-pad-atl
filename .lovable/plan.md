## What I got wrong last time
I named things by *category* (AI workspace, Library) instead of by *the artifact the founder walks away with*. After reading each route, here's what each page actually delivers — and a label proposal rooted in that, not in tech vocabulary.

## What each page actually delivers → proposed label

### 1. `dashboard/index.tsx` — currently **"Today"**
**Delivers:** A context-aware home that changes by lifecycle phase — pre-workshop countdown + venue, in-session live block + raise-hand, post-workshop "Day X of 90" with the single next action.
**Keep:** **Today**
**Why:** Single-word, accurate, and the page literally changes every day. No better word exists for "your daily home."

### 2. `dashboard/day.tsx` — currently **"Workshop day"**
**Delivers:** Pre-workshop orientation — your date, venue, the morning's block-by-block schedule, the "bring four things" checklist, and the two entry paths (Guided vs. Fast venture).
**Change to:** **Workshop day** (keep) — or **"Your workshop"** if you want it to feel possessive.
**Why:** "Workshop day" is already accurate; it's about *the day itself* — agenda, venue, what to bring. Don't fix what isn't broken.

### 3. `dashboard/brief.tsx` — currently **"My startup"**
**Delivers:** The 10-question voice-or-type wizard that produces *the Brief* — the single source of truth every AI deliverable reads before generating. Has block checkpoints, a completeness score, and unlocks the rest of the system.
**Change to:** **Startup brief**
**Why:** The artifact is literally called "the brief" throughout the codebase and the UI ("BriefReview", "BriefCompleteCard", completeness score). "My startup" is a generic noun; "Startup brief" names the deliverable. The brief is also what *unlocks* generation downstream — so the label signals importance.

### 4. `dashboard/workflow.tsx` — currently **"Plan (25 steps)"**
**Delivers:** A control panel of **20 AI deliverables across 5 pillars**. The user generates them one-at-a-time or via "Run remaining," sees lock/dependency/in-progress/done state per card, and clicks "View" to read the finished doc.
**Change to:** **Deliverables**
**Why:** "Plan (25 steps)" is factually misleading — there is no 25-step plan, and the page is not a plan; it's a generator + viewer for 20 named documents. "Deliverables" matches what the workshop sells ("34 deliverables…") and matches the actual page content. The number-in-parens looked like a debug label.

### 5. `dashboard/hub.index.tsx` — currently **"Founders Hub"**
**Delivers:** A list of the founder's **ventures** (one card per startup concept). Each card → 34 documents for that concept. Star, archive, restore, delete. "New startup" button starts a new one.
**Change to:** **Ventures** (preferred) or **Startup concepts**
**Why:**
- "Founders Hub" is our internal product name; for a Main Street founder it's a meaningless container word.
- "Ventures" is what the DB, edge functions, and code call them (`venture-*` everywhere), and it cleanly describes the unit on screen — a list of distinct business concepts. It also disambiguates from #3 (singular brief for *your* startup) and #4 (the 20 workshop deliverables) — this is where you can keep multiple startup *concepts* side-by-side.
- I want to flag that #3, #4, #5 all touch "startup stuff" and the IA is genuinely overlapping. The label choices above are the most distinct set I can give you without restructuring routes — please confirm if you'd rather we revisit IA.

### 6. `dashboard/files.tsx` — currently **"My files"**
**Delivers:** A 3-tile router → "Made by your AI" (deliverables), "Documents" (PDFs/contracts), "Photos & media" (logos/brand assets). No content of its own.
**Change to:** **My files** (keep)
**Why:** It's a navigation shelf, and "My files" maps to what a non-technical founder expects. "Library" sounded nicer but added cognitive load.

### 7. `dashboard/profile.tsx` — currently **"Account"**
**Delivers:** Three-section intake — **Founder** (you), **Startup** (your company), **Financial** (revenue/burn/runway). Each saves independently. Ends with "Mark intake complete." Intro literally says *"The more we know, the more useful your generated deliverables will be."*
**Change to:** **Founder profile**
**Why:** This page has nothing to do with auth/billing/account settings — it's a rich profile that feeds the AI. "Account" sets the wrong expectation; "Founder profile" signals "tell us about you so the output gets sharper" (matching the page's own intro copy).

## Tooltips (~30 words each, grounded in what each page actually does)
- **Today** — "Your daily check-in. Before workshop day you'll see a countdown and venue; during the workshop, the live block in session; after, your 90-day progress and the next action waiting on you."
- **Workshop day** — "Your reservation in one place: the date, the venue with directions, the block-by-block morning agenda, the four things to bring, and the two entry paths to choose between when you arrive."
- **Startup brief** — "Answer ten questions by typing or by voice. The brief becomes the source every deliverable reads from — when it's complete and confirmed, your facilitator's AI can build the rest of your kit."
- **Deliverables** — "Generate your 20 investor-ready documents across five pillars. Build one at a time or run the remaining batch. Each card shows what's locked, what's queued, what's ready to read."
- **Ventures** — "Every startup concept you've explored, with its own 34-document workspace. Drop in a URL or describe an idea, then star favorites, archive what's noise, and reopen anything to keep refining."
- **My files** — "One shelf for everything yours: the documents your AI built for you, the PDFs and contracts you've uploaded, and the brand photos and logos you and your designer keep adding."
- **Founder profile** — "Tell us about you, your startup, and your numbers — revenue, burn, runway. Every field you fill makes every deliverable sharper. Save each section as you go; finish when it feels right."

## Scope
One file: `src/routes/_authenticated/dashboard.tsx` — update the `items: NavItem[]` array (new `label` strings + new `tooltip` field) and wrap each menu button in shadcn `Tooltip` (side="right", max-w-xs, delay 200ms). Add a single `TooltipProvider` in `AppSidebar`. No routes, no DB, no copy changes inside destination pages.

## Verification
Playwright at 1280×1800: sign in (injected session), open `/dashboard`, hover **Startup brief**, **Deliverables**, **Ventures**, screenshot each, confirm the rich tooltip renders to the right of the sidebar in both expanded and collapsed states.

## Two things I want your call on before I build
1. **Ventures vs. Startup concepts** for #5 — "Ventures" is shorter and matches the codebase; "Startup concepts" is more plainspoken for a first-time founder. Pick one.
2. **#3, #4, #5 overlap.** Brief (your one startup) + Deliverables (20 docs for your one startup) + Ventures (separate concepts, 34 docs each). If the dashboard really has two parallel doc-generation systems, no label set will fully fix the confusion — say the word and I'll plan an IA pass next.
