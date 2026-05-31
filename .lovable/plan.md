## Problem

The free-cohort homepage (`HomeSelection`) tells founders tuition, materials, and lunch are covered, but doesn't set a clear expectation that they'll personally cover small pass-through costs (domain, hosting, email, state filing fees, AI/SaaS trials) the day-of. The existing one-liner in `WhyDoingThis` ("Hard costs after the day… aren't covered") is too easy to miss and doesn't name a dollar figure.

We need a warm, confidence-building callout that names a ~$100 ceiling, frames it as *their* assets staying in *their* name, and makes it feel like a feature — not a fee.

## Fix

Add a new compact section, `BringYourCard`, to `src/components/home/HomeSelection.tsx` and slot it directly after `WhatYouWalkOut` (the deliverables grid) and before `ArtOfThePossible`. That placement is the natural moment — right after a founder sees everything they walk out with, we explain the small, real-world piece they own.

### Copy (final, ~95 words in the body, friendly + non-scary)

- Eyebrow: `A small heads-up`
- Headline: `Bring a card for the small stuff — everything stays in your name.`
- Body:
  > Your seat, the build, the brand, the materials, lunch — all covered. The only thing we ask you to bring is a personal card for the handful of tiny pass-through costs that happen the day you go live: your domain (~$12), email + hosting trials, a state filing fee, maybe an AI tool subscription. Budget up to **$100** total and you'll have margin to spare. Everything gets set up in *your* name, on *your* accounts, with *your* card — because on day one, you should own every login, every receipt, every asset. We just stand beside you while you click "buy."

- Reassurance row (3 inline chips with icons):
  - `ShieldCheck` — "Everything in your name"
  - `Wallet` — "Up to ~$100 total"
  - `Sparkles` — "Optional — skip anything you don't need"

### Styling

- Reuse the existing pattern: `<section className="py-12 md:py-20">` with `mx-auto max-w-4xl px-6`, eyebrow `text-xs uppercase tracking-[0.18em] text-muted-foreground`, headline `text-3xl md:text-4xl font-semibold` with a `<span className="text-gradient-brand">` highlight on "stays in your name."
- Wrap the body in a soft card: `rounded-2xl border border-white/10 bg-card p-6 md:p-8`.
- Chip row: `flex flex-wrap gap-2`, each chip `inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground`.
- Icons from `lucide-react` (`ShieldCheck`, `Wallet`) added to the existing import block; `Sparkles` is already imported.

### Cleanup

In `WhyDoingThis`, remove the now-redundant trailing paragraph ("Hard costs after the day — state filing fees, hosting, subscriptions…") so we don't say it twice. The new section replaces and upgrades it.

## Out of scope

- No changes to `/register`, pricing, the original (paid) homepage, or the admin toggle.
- No new data, no server fn, no DB. Pure presentational copy + layout.
- The `$100` figure is hardcoded as a constant at the top of the file (`INCIDENTALS_CAP = 100`) so it's easy to tune later without re-reading the prose.
