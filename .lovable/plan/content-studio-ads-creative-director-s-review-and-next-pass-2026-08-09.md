# Content Studio ads — creative director's review and next pass

## What these three ads get right

The photography is finally on-topic: a creator filming one SKU on a phone rig, a customer unboxing on a porch, a wall of UGC stills. That was the last fix and it worked. The type is real editorial serif, the kicker taxonomy (UGC STRATEGY / UGC CASE STUDY / UGC SYNDICATION) is a good system, and the headlines make claims instead of naming topics.

## What an art director would send back

**1. The scrim reads as an opaque slab with a hard seam.**
The gradient runs bottom-up from the brand surface at ~92% opacity, and its height is derived from the type block. On a light surface that top edge lands as a visible horizontal cut straight through the subject — through the mug and the model's forearm in the porch frame, through the bottom row of Polaroids in the case-study frame. It looks like two images glued together, not one poster. Fix: a fixed-ratio band (locked to 38/42/34% by aspect), a longer feathered ramp so no edge is perceptible, and the photograph composed to that exact band rather than the band sized to the copy.

**2. The logo lands on faces.**
Corner choice is currently made on contrast alone. In the porch frame the white mark sits directly across the model's eyes; in the case-study frame the black mark covers two subjects' heads. No amount of contrast math saves a mark parked on a face. Fix: face and saliency detection on the plate, corners scored on emptiness first and contrast second, and a hard veto on any corner containing a face.

**3. The logo is roughly twice the size it should be.**
At this scale it competes with the headline for first read. A poster has one hero. Fix: cap the mark at ~11% of the short edge on 1:1 and 9% on 4:5, and lock it to the corner diagonally opposite the type block.

**4. The kicker sits in the weakest part of the scrim.**
It renders at the top of the type block where the gradient is nearly transparent, so it falls on trees, wall texture or photo edges. Fix: sample contrast for the kicker line specifically, not for the block as a whole, and lift the ramp locally if it fails.

**5. The CTA is not doing a CTA's job.**
"Download the playbook" is set in the same weight as body text with only a short rule above it. It reads like a caption. Fix: give the CTA a real affordance — small caps with a chevron, or an outlined pill in the accent colour — and let the poster copy pass write an imperative line ("Get the playbook") rather than a descriptive one.

**6. The three ads don't read as one campaign.**
Same layout three times, but the colour grades diverge (cool fluorescent, warm woodland green, flat grey studio) and the type scale jumps between frames. A week of posts should look like a set: shared grade, shared type scale, varied composition. Right now it's the opposite.

## Workflow changes — where the real gain is

The generation loop is per-ad. Every quality decision is made blind to the other six posts in the week, so cohesion is impossible by construction. Three changes:

**A. Campaign art direction at week level.** When a week is generated, derive one campaign card first (colour grade, time of day, lens family, palette weighting, kicker taxonomy, type scale) and pass it to every ad in that week. Individual scenes still vary; the look does not.

**B. Set-level QA, not just frame-level QA.** After a week finishes, run one vision pass over the whole set: are the grades consistent, are two frames too similar, does any headline repeat a claim, does any frame break the type-band contract? Flag the outliers and offer a one-click "reshoot the flagged ads".

**C. A contact sheet review step.** Present the week as a grid with the QA flags surfaced (scene source, contrast, logo corner, line width), so the founder approves or reshoots at set level instead of clicking into seven cards.

Supporting changes: saliency-aware placement for the mark, a locked type-band contract shared by the prompt and the compositor so the photograph and the layout agree, and a small variation engine that rotates layout across the week from the campaign card instead of a per-post hash.

## Technical detail

- `_shared/content-ad-svg.ts` — fixed-ratio scrim band by aspect with a multi-stop feather; per-line contrast sampling for kicker and CTA; logo cap at 9-11% of the short edge; CTA affordance (chevron or outlined pill in accent).
- New `_shared/plate-saliency.ts` — downsample the plate, score corner quadrants for edge energy and skin-tone/face likelihood, return a ranked corner list. `content-ad-svg.ts` picks the top corner that also clears contrast.
- New `_shared/campaign-card.ts` — one Lovable AI call per week producing `{grade, time_of_day, lens, type_scale, layout_rotation, kicker_taxonomy}`, cached on the snapshot alongside the scene brief.
- `venture-content-ad/index.ts` — accept and apply `campaignCard`; write the resolved band ratio and logo corner into `qa_notes`.
- `_shared/content-ad-director.ts` — state the exact reserved band ratio from the campaign card, and carry the grade/lens directive so the week matches.
- `_shared/poster-copy.ts` — imperative CTA lines; de-duplicate claims across a week by passing sibling headlines as negative context.
- New `venture-content-week-qa` (or an action on the existing function) — set-level vision pass returning per-ad flags.
- `src/components/hub/ContentStudio.tsx` — contact-sheet grid for a finished week with QA chips and "reshoot flagged".

## Order of work

1. Scrim band + logo size/saliency + kicker contrast (visual fix, no new AI cost).
2. CTA affordance and imperative CTA copy.
3. Campaign card and week-level threading.
4. Set-level QA and the contact-sheet review UI.
