# Copy audit — homepage & adjacent pages

## Where I went wrong

Last pass I treated this like a naming-rules problem. The real problem is a copywriting problem: the hero hammers the same branded phrase four times in fewer than 100 words, then collides two branded phrases in one sentence.

Current hero, in reading order:

1. Eyebrow: **The 14-Day Launch Method** · Wed, Aug 19, 2026 · Norcross, GA
2. H1: **The 14-Day Launch Method.** First paying customer in two weeks.
3. New-way card: One live morning inside **The 14-Day Launch Method**. Revenue in two weeks.
4. Paragraph: **The 14-Day Launch Method** is one focused morning of **The 14-Day Pivot Method** — …
5. Micro-line: Not another course. Not raw AI. The done-with-you method replacing both.

Five mentions, two brand names, one tautology. A reader has already been told the name three times before we ask them to hold two names at once. That's the failure — not the rule.

## The copywriter's read

- **Name once at the top. After that, use the room, the morning, the method, or the sprint.** Branded names lose weight when repeated; verbs and images gain it.
- **"First paying customer in two weeks"** is the strongest phrase on the page. Protect it. Everything else supports it.
- **"Two weeks" beats "14 days" in body copy.** Save "14-Day" for the branded name and the countdown/agenda.
- **"Pivot Method" doesn't belong on the homepage at all.** It's an internal name for the underlying process. Introduce it *only* where the reader is asking "wait, what is this actually?" — the deep framework section or the concierge — never in the hero paragraph and never adjacent to Launch Method.
- **The "old way vs. new way" beat is already doing the heavy lift.** The paragraph below it should build tension, not restate the name.

## The rewrites

### 1. Hero paragraph — `src/components/home/HomeFramework.tsx` line 100

**Before:**
> The 14-Day Launch Method is one focused morning of **The 14-Day Pivot Method** — the done-with-you playbook quietly replacing accelerators, courses, and raw AI. The way modern founders skip the year of guessing and pivot to their first paying customer in two weeks. Run live by Adam, the operator who built it. $297 once, yours forever. **Full support during and after**, if you want it.

**After (name dropped — it's already in the eyebrow, H1, and card above):**
> One focused morning. A done-with-you playbook quietly replacing accelerators, courses, and raw AI. The way modern founders skip the year of guessing and land their first paying customer in two weeks — run live by Adam, the operator who built it. $297 once, yours forever. **Full support during and after**, if you want it.

Why: brand already stated three times above; opening with "One focused morning" picks up the "new way" card and moves. No tautology, no second brand name, tighter cadence.

### 2. Framework intro — `src/components/home/HomeFramework.tsx` line 187

**Before:**
> Raw AI hands you a folder of documents and no customers. An accelerator hands you a year of homework. The 14-Day Launch Method — run in the room by the operator who built it — hands you a business…

**After (rhythm of three, brand name kept once because this section's eyebrow is "Inside The 14-Day Launch Method" and the reader is now deep enough to want the name):**
> Raw AI hands you a folder of documents. An accelerator hands you a year of homework. This hands you a business — offer priced, first customer named, first channel open, outreach going out that afternoon. $297 once, yours to run with.

### 3. "New way" card — `src/components/home/HomeFramework.tsx` line 94

**Before:** One live morning inside **The 14-Day Launch Method**. Revenue in two weeks.

**After:** One live morning in the room with Adam. Revenue in two weeks.

Why: brand name is already in the H1 directly above the card. Substituting "in the room with Adam" adds a person and a place — both convert harder than a repeated brand name.

### 4. Micro-line — `src/components/home/HomeFramework.tsx` line 106

**Keep as is.** "Not another course. Not raw AI. The done-with-you method replacing both." lands cleanly and doesn't repeat the brand.

### 5. `src/routes/one-on-one.tsx` line 88–93 subhead

Already fixed the H1 last pass. The paragraph still says "the done-with-you method replacing accelerators, courses, and raw AI — executed for you at a flat fee." That's fine — keep.

### 6. `src/routes/webinar.tsx` lines 36–44

The H1 says "**The 14-Day Launch Method,** live on Zoom." then the paragraph opens "The same method, run live over video…" — that's already tight after last pass. Keep.

### 7. `src/routes/build.tsx` line 24

Body paragraph currently reads: "…extending the done-with-you method behind The 14-Day Launch Method." Now that the H1 no longer repeats a brand name, this reads cleanly. Keep.

### 8. Anywhere else Pivot Method appears in user-facing copy

Only remaining hit after these rewrites is `src/lib/chatbot-knowledge.ts`, which is the concierge's internal vocabulary doc — correct home for it. No further changes.

## Files touched

- `src/components/home/HomeFramework.tsx` — three tightening edits (hero paragraph, new-way card, framework intro)

That's it. One file. The other pages already read cleanly after the last pass; the real damage was concentrated on the homepage.

## Out of scope

- No changes to the offer name, price, dates, CTAs, section structure, or the Pivot Method as an internal/concierge concept.
- Not touching dashboard, welcome, schedule, services, build/$slug, or AccessModeDialog — all read fine.

## Verification

- `rg "14-Day Launch Method" src/components/home/HomeFramework.tsx` → should drop from 5 hits to 3 (eyebrow, H1, framework eyebrow).
- `rg "Pivot Method" src/` → only `chatbot-knowledge.ts`.
- Read the hero top-to-bottom out loud. It should land as: name → promise → old/new → one paragraph of texture → CTA. No name repeated back-to-back.
