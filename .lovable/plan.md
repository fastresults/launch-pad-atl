## What's off today

Two spots on the homepage accidentally suggest the workshop hands you an idea:

1. **Hero subhead** ("Walk in with an idea") is good, but the body copy never reinforces *your* idea is the one that gets built.
2. **"The art of the possible"** opens with **"Pick yours."** — that reads like a menu. The cards look like options to choose from, not proof of what other founders are launching in 2026.

The fix is copy-only, in two places. No layout changes, no new sections, no logic changes.

## Plan

### 1. Hero — add one reinforcing line (`src/routes/index.tsx`, hero body)

Keep the existing subhead. Add a short sentence right after it so the promise is unmistakable:

> Seven focused hours at the IGNITE Center in Norcross, GA. **You bring the idea — even a rough one. We build *your* business, not a template.** By 4:30 PM you'll have a real business on paper, a simple way to deliver it, a website ready to publish, your full marketing kit, and a 90-day plan with your next ten moves already on the calendar.

One sentence, woven into the existing paragraph. No new element.

### 2. "The art of the possible" — reframe the section header

Change the eyebrow, headline, and lead paragraph so the section reads as *evidence*, not a *catalog*.

- **Eyebrow** (unchanged tag, new words): `What others are starting in 2026`
- **Headline:** Replace **"Pick yours."** with something like:
  > **Proof, not a menu.** *These are the kinds of businesses real people are launching in 2026 — online, on a street corner, out of a kitchen, off a phone, or built around AI.*
- **Lead paragraph** (replaces today's "Pick yours…" copy):
  > Scroll through for inspiration. **Yours doesn't have to be on this list — it shouldn't be.** You walk in with your idea, and we build the business around it using the same seven stages. Under $10,000 to start. A focused 90 days to launch.

### 3. Bridge card at the bottom of the section — tighten the handoff

Today it says: *"Every business above gets built with the same seven stages — in one day, in this room."*

Update to make the *your-idea* point land one more time:

> Whether your idea looks like one of these or nothing like them, **it gets built the same way** — the same seven stages, in one day, in this room.

That's the whole change. No new components, no new files, no animation or layout edits.

## Files touched

- `src/routes/index.tsx` — hero paragraph (around line 72–77), `TheArtOfThePossible` header block (lines ~750–768), and the bridge card paragraph (~802–806).

## Verification

- Reload `/`, read the hero out loud — the words "you bring the idea" or "your business, not a template" appear above the fold.
- Scroll to "The art of the possible" — the first thing the eye lands on is *"Proof, not a menu"* (or the agreed phrasing), not *"Pick yours."*
- The bridge card under the marquee ends on the same message: your idea, our stages.
