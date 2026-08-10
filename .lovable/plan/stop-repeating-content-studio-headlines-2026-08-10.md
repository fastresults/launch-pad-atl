# Stop repeating Content Studio headlines

## Confirmed diagnosis

This is not a subjective copy complaint. The saved output contains direct repeats:

- Week 3: `Launch 15-plus ad variants in 30 days`
- Week 4: `Launch 15 fresh ad variants in 30 days`
- Week 7: `Launch 15 ad variants in 30 days`
- Week 10's three ads all repeat “recycled/old ads delay the next scalable message.”
- Week 11's three ads all repeat “another week/recycling/every rerun delays customer-led replacements.”

The database comparison found up to seven shared words between supposedly distinct headlines.

### Why the previous fix did not solve it

1. **The old campaign arc remains cached.** `ensureCampaignArc()` returns any structurally usable cached arc without running the new normalizer. Existing ventures therefore keep the repetitive claims created before the latest logic.
2. **Regenerate week does not refresh strategy.** The UI’s `force` option regenerates artwork, but `runWeek()` does not pass `refreshArc`; the same stale weekly claim is fed back into every new headline.
3. **The source strategy itself repeats.** Saved weeks 10 and 11 both center on delayed replacement of fatigued creative. A headline writer cannot create a genuinely new argument from two near-identical briefs.
4. **The guard compares headlines to strategy claims, not to the complete prior headline ledger.** Lexical overlap is checked against `usedClaims`; semantic repeats with different wording survive.
5. **The guard knowingly ships failed duplicates.** After one unsuccessful rewrite, `poster-copy.ts` logs the repeat and continues compositing the original line.
6. **The latest code is only reaching new output.** Older saved ads have no recorded `approach`; the newest week-12 row does. That confirms the visible repeated set predates or bypasses the new approach metadata rather than proving the new guard repaired it.

Gateway evidence: the latest Content Studio request succeeded and built week 12 from three source posts that already reuse “scale,” “customers,” and “authentic” language (`log_id 019fe90b-def5-750e-b5cd-88120313d083`, 2026-08-10 00:21:40 UTC). Function logs show that run reached campaign-card creation and image generation; there is no function error explaining the repetition.

## Build plan

### 1. Version and invalidate campaign strategy

- Add an explicit campaign-arc schema/strategy version and source-content fingerprint.
- Normalize every cached arc on read, not only newly generated arcs.
- Rebuild the arc when its version is stale, calendar inputs changed, or the user chooses a strategic regeneration.
- Validate adjacent and non-adjacent weekly claims before saving; reject semantically equivalent arguments.

### 2. Plan all headlines before generating any artwork

- Add a flight/week copy preflight that writes the three headlines together as a coordinated set.
- Give each ad a genuinely different job: claim, evidence, and objection/cost—not merely three prompt labels applied in separate calls.
- Compare the proposed set against every accepted headline and claim in the campaign before image generation begins.
- Persist the accepted copy manifest so sequential and background runs use one authoritative ledger.

### 3. Replace the weak repeat detector

- Normalize inflections and synonyms, then score phrase overlap, key-subject overlap, and semantic similarity.
- Detect repeated sentence frames such as `Turn X into Y`, `Launch 15...`, and `Every X delays Y`, even when one adjective changes.
- Enforce both within-week separation and cross-week separation.
- Return the exact conflicting prior line and reason in structured QA metadata.

### 4. Never ship a known duplicate

- Change repeat detection from warning-only to a hard acceptance gate.
- Retry with the conflicting language explicitly banned and a different rhetorical structure required.
- If no candidate clears the gate, mark the ad `copy blocked` and do not composite or save a misleading “passed” creative.
- Keep custom founder-entered headlines exempt from automatic rewriting, but show a duplicate warning.

### 5. Make regeneration actually repair existing ventures

- Add one clear **Rebuild campaign copy** action for the flight.
- It refreshes the arc, creates a new headline manifest, shows old versus proposed headlines, then regenerates approved creatives.
- Existing image assets remain untouched until the replacement copy passes the campaign-wide gate.
- Use this flow to replace the confirmed repeated weeks 3, 4, 7, 10, and 11 for the current venture.

### 6. Add regression coverage and observable logs

- Unit-test exact duplicates, near duplicates, synonym swaps, repeated sentence frames, and legitimate shared brand terms.
- Integration-test sequential week generation and full-flight generation against the same ledger.
- Log arc version, week claim, approach, candidate headline, conflict line, similarity reason, retry result, and final acceptance.
- Surface a compact Content Studio QA state: `Distinct`, `Conflict`, or `Copy blocked`.

## Technical scope

- `supabase/functions/_shared/campaign-arc.ts`: cache versioning, normalization-on-read, claim-level distinctness validation.
- `supabase/functions/_shared/poster-copy.ts`: campaign headline ledger, stronger repeat scoring, hard rejection behavior.
- `supabase/functions/venture-content-ad/index.ts`: copy-manifest preflight and authoritative accepted headline lookup.
- Content Studio generation flow: forward strategic refresh options correctly and add the rebuild/review action.
- Tests for campaign arc caching, headline acceptance, and week/full-flight generation.

## Acceptance criteria

- No generated headline can be saved when it conflicts with another accepted campaign headline above the repeat threshold.
- The three ads in a week communicate three distinguishable arguments and use distinguishable sentence structures.
- Regenerating a week cannot silently reuse a stale campaign arc.
- Existing cached ventures automatically receive the current strategy rules.
- Weeks 3, 4, 7, 10, and 11 no longer contain the confirmed repeated lines after the repair flow runs.