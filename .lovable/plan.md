# Rewrite the animated chat-box text as founder pain questions

Foundation stays exactly as it is. Only the eight build workshops change.

## The problem

Today the ghost text that types itself inside the hero chat box reads like an answer the visitor is supposed to supply ("Property managers with 20+ units", "Instagram, but I post twice a year"). That asks the visitor to already know the answer. It should instead sound like the complaint already in their head — the question they'd type if they trusted the box.

## The change

Rewrite `promptExamples` (the rotating ghost lines) for each of the eight build workshops so every line is a first-person problem or question in the founder's own voice. Also tighten each `inputLabel` so the accessible label matches the new framing ("Tell us what's not working").

New ghost lines, 4 per workshop:

**Brand** — "People don't take my business seriously." / "My logo looks like I made it myself." / "I can't explain what I do in one sentence." / "Why do people pick the bigger name over me?"

**Website** — "My site gets traffic but nobody books." / "Pages load slow and people bounce." / "Nobody can find the price or the button." / "Why isn't my website bringing me any calls?"

**Sales** — "I'm not converting the leads I get." / "I hate the part where I say the price." / "I only get work by word of mouth." / "Why do people ghost after the quote?"

**Email & CRM** — "Leads go cold because I forget to follow up." / "My emails land in spam." / "I have a list and I never mail it." / "Why do people ask a price and vanish?"

**Social** — "I can't post consistently to save my life." / "I post and get nothing back." / "I don't know which platform is even worth it." / "Why does no one engage with what I post?"

**Content** — "I never know what to write about." / "I answer the same questions over and over." / "Nothing I publish brings in a customer." / "Why doesn't Google ever show my business?"

**AI ops** — "I'm buried in admin every night." / "I rewrite the same quote from scratch weekly." / "I'm the bottleneck in my own business." / "Why am I working Sundays for this?"

**Legal & money** — "I still haven't formed the LLC." / "I work off handshakes and texts, no contract." / "My books are a shoebox and an app." / "Am I going to get burned by this at tax time?"

## Technical notes

- Single file edit: `src/lib/workshop-catalog.ts` — the `BUILD_META` map's `promptExamples` and `inputLabel` fields for the eight build slugs.
- `FOUNDATION` object is untouched (it has empty `promptExamples` and keeps its own copy).
- No component changes needed: `CinematicHero` → `IdeaPrompt` already cycles `promptExamples` as ghost text, and the diagnostic modal already reads the typed input, so longer lines flow through unchanged.
- Lines are kept short enough to not truncate in the single-line ghost row on mobile.
