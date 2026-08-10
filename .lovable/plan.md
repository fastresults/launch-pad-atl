# The Website PRD you're looking at is two months old

The award-winning PRD engine is still there — art direction, image craft contract, copy craft, portrait spec, identity guard, logo URL injection. It just never lands for this venture. What's on screen is the *original* June 26 draft.

## What the data says

The `website_prd` row for The Athletes Prayer Foundation:

- `created_at` 2026-06-26, **version 1**, 906 words, quality 96
- `generation_attempts` **5**, `last_error` "The signal has been aborted"
- `status` still **generating** (never flipped to complete or failed)
- content has no master-prompt block and no image-craft rows — the tells of a pre-overhaul document

Other ventures generated on the new engine came out at 17k–55k characters with the master prompt intact. This one is 6.3k because it predates all of it.

Today's run (22:37 UTC) shows exactly how it dies in the function logs:

```text
22:37:30  booted
22:40:03  identity guard failed website_prd { copyGeneric: true }   <- repair pass starts
22:40:50  shutdown                                                  <- worker killed mid-repair
```

The first model call plus the page-copy expansion burns ~150s. The identity guard then fails on `copyGeneric` and fires a full repair call with the whole draft echoed back. The edge worker's wall clock ends before that call returns, so the save never happens — including the background `waitUntil` handoff, which dies with the worker. Nothing is written, the row stays `generating`, and the UI keeps rendering the June draft as if it were current.

## The fix: checkpoint, then finish in a second pass

**1. Save the draft before any repair.** As soon as the first model response is cleaned and identity-substituted, write it to the row with `status: "generating"` and a `metadata.phase` marker. Worst case the founder gets a real new-engine draft instead of a two-month-old one.

**2. Move enrichment out of the request.** Page-copy expansion and identity repair become a second phase in a dedicated invocation (`phase: "refine"`), self-invoked after the checkpoint. Each phase gets one model call and its own fresh wall clock, so neither can be truncated by the other.

**3. Cap the repair loop.** At most two repair attempts. If the guard still fails, publish the best draft with `status: "complete"` and record the unmet checks in `metadata.quality_gaps` — a slightly imperfect current PRD beats a stale one forever.

**4. Never leave a row wedged.** A `generating` row untouched for more than 6 minutes is swept to `failed` by the existing watchdog, with `last_error` set. Any regeneration that starts on a row already at attempt 3+ logs a failure record so it surfaces in admin triage instead of silently retrying.

**5. Make staleness visible.** In `DocumentViewer` and the Brand Studio PRD card: when the stored PRD is missing the master-prompt block (i.e. it's pre-overhaul), show a "Rebuild with the current engine" banner instead of presenting it as a finished asset. The existing `useWebsitePrd` staleness check only compares against brand-lock time, so it never caught this.

## The PRD writes from the whole brain and the actual logo art

Two inputs are currently thinner than they should be.

**Full second-brain context.** The generator slices the brain down to the deliverable's declared `context_keys` (`pickBrainSlice`) plus a short retrieval block. For the Website PRD that is the wrong economy — a site brief needs the entire venture: offer, pricing, ICP segments, objections, proof, financial model, competitive position, voice, geography, founder story. The PRD becomes a **full-brain deliverable**: the complete compressed brain JSON, plus a wider `brainCorpusBlock` retrieval (more chunks, queried per PRD section — audience, offer/pricing, proof, technical), plus the locked brand kit. Because generation is now phased, the larger prompt has the wall clock to work with.

**Brand read from the logo images, not just hex strings.** Today only a logo *URL* is injected for the `<img>` tag; the model never sees the mark. The PRD run will pass the actual artwork as vision input — primary logo, its reversed/mono variants, and the 9 mood board tiles — and derive from them: exact ink colors sampled from the mark, the mark's geometry and negative-space rules (which set the site's corner radius, rule weight, and grid rhythm), the type pairing observed in the lockup, and the imagery grade (contrast, saturation, grain) the mood board actually shows. Those observations are written into Section 1 (art direction) and the image-craft rows, so the site reads as an extension of the mark instead of a generic palette application. SVG logos are rasterized first (the existing rasterizer already used for social) so the vision model sees what a human sees.

**Guarded.** The identity guard gains two checks: the PRD must cite the logo-derived geometry/ink observations, and the copy must reference at least three concrete brain facts (a real price, a named segment, a real proof point). Failing either triggers the same bounded repair pass — this is what would have caught the current `copyGeneric` failure at its root rather than after the fact.

**Regenerate this one.** After the fix ships, rerun the PRD for The Athletes Prayer Foundation and verify the output carries the master prompt, the committed archetype name, the ≥12-row imagery table with craft directives, the logo `<img>` tag, logo-derived art direction, real TAP facts (the $85–120 pro tier, the locker delivery, the 501(c)(3) structure), and Section 4 above the word floor.

## Technical notes

- `supabase/functions/venture-generate-document/index.ts`: checkpoint write after `substituteIdentity`; extract expansion + repair behind a `phase` argument; self-invoke phase two with the service key; bound the repair loop; always terminalize status. For `website_prd`, bypass `pickBrainSlice` (send the full brain) and raise the corpus retrieval budget.
- Logo/mood board vision: reuse the SVG rasterizer and attach images as `image_url` content blocks on the phase-one call; feed the observations into `_shared/site-art-direction.ts` and `_shared/image-craft.ts`.
- `supabase/functions/_shared/identity-guard.ts`: add `logoCraftMissing` and `brainFactsThin` checks.
- `supabase/functions/venture-job-watchdog/index.ts`: add the stuck-`generating` sweep for `venture_documents`.
- `src/components/hub/DocumentViewer.tsx` and `src/components/hub/brand/use-website-prd.ts`: add an engine-version check (master-prompt marker present) driving the rebuild banner.
- No schema migration — `metadata`, `last_error` and `generation_attempts` already exist.

