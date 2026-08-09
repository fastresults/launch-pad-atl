# Content Studio weeks 1-8 — campaign strategy audit and fix

## What I read

The 24 calendar posts and the 30 generated ads for this venture, the calendar generator prompt, the week-level campaign card, the ad copywriter, and the ad function's week wiring.

## The audit

**1. There is no campaign arc. Weeks 2-8 are a three-pillar carousel.**
Every week from 2 onward is the same rotation: Monday "The Creative Engine (UGC Showcase)" on LinkedIn, Wednesday "Educational (Best Practices)" on LinkedIn/Facebook, Friday "Thought Leadership (Strategy)" on Reels. The pillar labels shuffle but the job of each week never changes. Nothing in week 5 depends on week 4 having run.

**2. The angles repeat almost verbatim.** Across eight weeks the ads make four claims:
- "turn customers into ad creators" — weeks 1, 4, 5, 6, 8
- "launch 15 variants in 30 days" — weeks 3, 4, 6, 7
- "polished ads lose to authentic content" — weeks 1, 7, 8
- "real voices make ad dollars work harder" — weeks 3, 5, 7

Week 8 ("Trade polished ads for content people trust") is week 1 ("Polished ads drain your contribution margin") with new words. A viewer who saw week 1 learns nothing new by week 8.

**3. Every ad is aimed at the same temperature.** All 30 CTAs are mid-funnel discovery: "See how…", "Discover…", "Learn how…", "Download the playbook." There is no cold-audience hook-only ad, no proof/objection ad for warm viewers, and not one direct-response ad with an offer, a price, a deadline or a booking. The set cannot convert because nothing in it asks for the conversion.

**4. No audience segmentation.** Kickers name topics (UGC STRATEGY, SCALE SYSTEM), not people. The only segment-shaped kickers appear in week 1 (DTC FOUNDERS, FIRST-TIME FOUNDERS) and are then dropped. One undifferentiated "founder" is addressed for eight weeks.

**5. Root cause is upstream, in two places.**
- The calendar generator (`content_calendar_90day` prompt in `_shared/deliverable-prompts.ts`) asks for "3 posts per platform per week" against content pillars. It never asks for funnel stages, an offer, a sequence, or non-repetition. A pillar rotation is exactly what it was told to produce.
- The week-level campaign card (`_shared/campaign-card.ts`) governs *look only* — grade, lens, band ratio, layouts. There is no equivalent object governing *argument*. So the ad copywriter is de-duplicated within a week (sibling hooks are passed) but is blind across weeks.

## The fix — a campaign arc, not a pillar rotation

### A. An eight-week arc object

New `_shared/campaign-arc.ts` derives one arc for the whole flight, once, cached on `venture_content_progress` beside `campaign_cards`. Each week gets a strategy card:

| Week | Stage | Audience | Job of the week | CTA type |
|---|---|---|---|---|
| 1 | Disrupt | Cold — problem-unaware | Name the expensive belief | No ask; hook only |
| 2 | Reframe | Cold — problem-aware | Show the mechanism behind the problem | Soft follow / save |
| 3 | Proof | Warm — engaged | One customer, one number, one story | Watch the case study |
| 4 | Differentiate | Warm | Why this beats the obvious alternative | Compare / read |
| 5 | Objection | Warm — considering | Kill the top three reasons not to buy | Answer / DM |
| 6 | Offer | Hot | The actual offer, plainly stated with terms | Book / start |
| 7 | Proof at scale | Hot — hesitating | Volume of results, risk reversal | Book / start |
| 8 | Urgency | Hot — retarget | Deadline, capacity, cost of waiting | Book now |

Each week's card carries: stage, audience segment and temperature, the single claim it owns, banned claims (everything earlier weeks already used), the proof asset it draws on, CTA type, and the metric that judges it.

### B. An angle ledger so nothing repeats

The arc derives a list of distinct angles up front and assigns each to exactly one week. Every ad's copy call receives the week's assigned angle plus the full list of already-used claims as negative context — the de-duplication that currently works inside a week now works across the whole flight.

### C. CTA ladder tied to stage

`poster-copy.ts` currently writes one imperative line with no notion of funnel stage. It takes a `ctaType` from the week card and writes to that rung: no ask at Disrupt, a save/follow at Reframe, a real conversion ask with the offer named at Offer/Urgency.

### D. Audience-shaped kickers

The kicker taxonomy comes from the arc's audience segment for that week (e.g. `FIRST 90 DAYS`, `SCALING PAST 7 SKUS`) rather than a topic label, so consecutive weeks visibly speak to different people.

### E. Fix the calendar generator

Rewrite the `content_calendar_90day` prompt to produce a funnel: each week declares stage, audience, the one claim it owns, the offer proximity, and a non-repetition constraint against prior weeks. New calendars are then born sequential instead of being patched afterwards. Parser and the `pillar` column stay as they are; the stage rides in a new field.

### F. Make the strategy visible in Content Studio

Each week header in `ContentStudio.tsx` shows its stage badge, audience, the claim it owns and its CTA rung, plus a flight strip across the top so the founder sees the arc. A "repeats week N's claim" flag appears on any ad whose headline collides with an earlier week.

### G. Re-plan the existing eight weeks

A one-click "Re-plan the flight" action derives the arc against the current 24 posts, reassigns angles and CTA rungs, flags the ads that no longer match their week's job, and offers to regenerate only those. Existing artwork that still fits is kept.

## Technical detail

- New `supabase/functions/_shared/campaign-arc.ts` — `deriveCampaignArc` (one Lovable AI call over the venture brief + all posts) returning `{ weeks: WeekCard[], angleLedger: string[], offer: {...} }`; `ensureCampaignArc` caches it on `venture_content_progress`.
- Migration: add `campaign_arc jsonb not null default '{}'::jsonb` to `venture_content_progress`.
- `venture-content-ad/index.ts` — load the arc alongside the campaign card; pass `weekCard` and `usedClaims` into `buildPosterCopy` and `buildContentAdPrompt`; record stage, angle and CTA rung in `qa_notes.campaign`.
- `_shared/poster-copy.ts` — accept `stage`, `ctaType`, `assignedAngle`, `usedClaims`; write the CTA to the stage's rung; reject a headline that restates a used claim.
- `_shared/content-ad-director.ts` — carry the stage into the scene brief so a Disrupt frame and an Offer frame do not look like the same photograph.
- `_shared/campaign-card.ts` — derive the week's look from its arc stage (cooler and starker early, warmer and more human at proof and offer).
- `_shared/deliverable-prompts.ts` — funnel-shaped `content_calendar_90day` prompt; `venture-parse-content-calendar` reads the new stage field.
- `src/components/hub/ContentStudio.tsx` (+ week header component) — flight strip, per-week stage badges, repeat-claim flags, "Re-plan the flight".

## Order of work

1. Arc derivation + cache + migration.
2. Copywriter wiring: angle ledger, CTA ladder, cross-week de-duplication.
3. Calendar generator prompt so new ventures start sequential.
4. Studio UI: flight strip, stage badges, re-plan and selective regeneration.
