# Campaign arc + headlines — Ogilvy review and fix

## What I read

The stored campaign arc for this venture, all 49 generated ads with their written kicker / headline / CTA, `_shared/campaign-arc.ts`, and `_shared/poster-copy.ts`.

## Verdict: the arc is sound, the headlines are not

The arc object itself is genuinely good strategy — one claim per week, a real offer, a CTA ladder. The failure is downstream and in one place in the arc normalizer.

### 1. The stage sequence isn't enforced

The prompt says "one stage per week, in order". `normalize()` accepts whatever stage the model returns and never checks the sequence. The result in the live arc: week 3 and week 4 are both `proof`, and weeks 9, 10 and 11 are all `urgency`. Three consecutive urgency weeks is not a funnel, it's nagging. The stage order must be assigned by position, not asked for.

### 2. Within a week the three ads are the same ad

Week 10, verbatim:

```text
Old ads keep your next scalable message untested
Recycled ads delay your next scalable message
Every recycled ad delays your next scalable message
```

Same kicker on all three (`STILL WAITING`), same CTA. Cross-week de-duplication works; within-week does not, because siblings are passed as *hooks*, not as the *headlines already written*, and each ad is generated in its own call with no knowledge of its siblings' output.

### 3. Headlines fail Ogilvy's actual tests

Ogilvy: the headline is 80 cents of the dollar; it must promise a benefit, carry news, and be *specific* — and specificity means numbers, names and facts, not adjectives.

| Test | Result |
|---|---|
| Names a benefit to the reader | Partly — mostly names a problem |
| Contains news | No — no launch, no finding, no date |
| Specific (a number, a name, a place) | **No.** 46 of 49 headlines contain no number at all |
| Names the product or brand | Never |
| Speaks to the reader ("you") | Rarely |
| Would work without the picture | Mostly no |

The arc *has* the specifics — `2x ROAS`, `40% SKU-launch lift`, named offer — and the copywriter never receives them. So it writes the abstraction instead: "Turn customer stories into ads that perform", "Scale fresh ads without adding work", "Give great content the reach it deserves". Category wallpaper. Any competitor could run them unchanged.

### 4. The headline restates the claim instead of dramatizing it

Week 11 claim: "Every week spent recycling fatigued ads delays new customer-led concepts." Headline: "Another week delays customer-led replacements." That's the strategy note with words removed. The claim is the *brief*; the headline is supposed to be the *idea*.

### 5. Weeks 1–8 are stale and off-subject

Those ads were made before the arc existed — no stage recorded — and several are from a different venture's calendar entirely (dementia care, Stone Mountain retirement) sitting alongside the UGC ads. They also still carry the old mid-funnel CTAs ("Discover…", "See how…") the ladder was built to replace.

### 6. The validator polices grammar, not persuasion

`headlineIssue()` catches listicles, ellipses and dangling words. Nothing checks whether the line is specific, whether it says anything a competitor couldn't, or whether it duplicates its sibling.

## The fix

**A. Lock the stage sequence.** `normalize()` assigns `STAGE_ORDER[i]` by index and ignores the model's stage choice (keeping its audience, claim, proof and metric). Flights longer than 8 weeks repeat the ladder deliberately — reframe → proof → objection → offer — instead of stacking urgency.

**B. Feed the copywriter the proof, and demand it.** Pass `arcWeek.proof` and `offer` into `buildPosterCopy`, with an instruction that the headline must carry one concrete particular — a number, a timeframe, a named customer type, a price — drawn from the proof. Where the week genuinely has no number, it must carry a named specific instead.

**C. Three angles per week, not three paraphrases.** Each of a week's ads gets an assigned *approach* from the campaign card: `claim` (flat assertion of the benefit), `proof` (the number, stated as news), `edge` (the cost of the status quo / the objection). The copy call receives its approach plus the headlines already written for that week, and a near-duplicate is rejected and rewritten.

**D. A specificity gate.** New soft-then-hard check in `poster-copy.ts`: reject a headline that contains none of {digit, proper noun, named timeframe, named audience} AND is built only from category abstractions (a banned-phrase list: "drive results", "that perform", "unlock", "scale your", "work harder", "the reach it deserves"). One rewrite with the reason, then flag `headline_specificity: "abstract"` in QA so it's visible rather than silent.

**E. Vary the kicker per ad.** Kickers come from the week's taxonomy, cycled by approach, so three ads in a week don't share one eyebrow.

**F. CTA rung correctness on old weeks.** A "Re-plan and reshoot" action regenerates weeks whose recorded stage is missing or whose CTA doesn't match its rung — which is all of weeks 1–8 here — and drops the calendar posts that belong to a different venture's subject matter.

**G. Show the scorecard.** Each ad card in Content Studio gets a small readout: stage, approach, and whether the headline passed the specificity gate. The founder can see which lines are wallpaper before spending on them.

## Technical detail

- `_shared/campaign-arc.ts` — positional stage assignment in `normalize()`; drop `stage` from the model contract (keep audience/claim/proof/metric); ladder repeat rule for >8-week flights; expose `weekApproaches(week)`.
- `_shared/poster-copy.ts` — new args `proof`, `offer`, `approach`, `siblingHeadlines`; approach-specific brief; `specificityIssue()` with the abstraction blocklist and particular-detector; one targeted retry; `headline_specificity` and `approach` on `PosterCopy`.
- `_shared/campaign-card.ts` — carry the per-ad approach rotation alongside the layout rotation.
- `venture-content-ad/index.ts` — resolve the ad's index within its week, pass approach + already-written sibling headlines (query `qa_notes->'poster_copy'->>'headline'` for the week), pass `arcWeek.proof` and `arc.offer`; record approach and specificity in `qa_notes.campaign`.
- `src/components/hub/ContentStudio.tsx` — approach + specificity chips on each ad; "Re-plan and reshoot stale weeks" action on the flight strip.

## Order of work

1. Stage-sequence lock (fixes three urgency weeks immediately).
2. Proof/offer threading + specificity gate — the Ogilvy fix.
3. Per-week approach rotation and sibling-headline de-duplication.
4. Studio chips and the reshoot action for weeks 1–8.
