## Problem

Copy across `/services`, `/build`, and the home framework keeps framing workshops as "learn the strategy first." That undersells them. Workshops deliver strategy **plus** the exact tools, templates, and step-by-step process to DIY the same outcome our agency would ship. The copy needs to say so — consistently, in the voice of a 20-year conversion expert.

## Positioning shift (the new through-line)

Old: "Learn the strategy first."
New: "Get the strategy, the tools, and the playbook to build it yourself."

Short variants to rotate (kept tight for chips/CTAs):
- "Build it yourself — strategy, tools, playbook · $297 workshop →"
- "DIY the same build — workshop $297 →"
- "Same playbook we use — workshop from $197 →"
- "Strategy + tools + process — $297 workshop →"

Hero/long-form variant:
- "Half-day workshop. You leave with the strategy, the templates, the tool stack, and the step-by-step process to ship it yourself — or hand it to our team."

## Files to update (copy only — no logic changes)

### 1. `src/routes/services.tsx`
- **Line 137 — service card CTA (the screenshot):**
  `Or learn the strategy first — {price} workshop →`
  → `Or DIY it — {price} workshop (strategy + tools + process) →`
- **Line 51 — hero subhead:** rewrite the "attended the workshop / already decided" line so the workshop alternative is described as "the full DIY playbook," not just strategy.
- **Line 65 / 478 — primary CTA "Start with a workshop — from $197":** keep the label, but the supporting line near it should make clear the workshop hands over templates + tool stack + SOPs, not just a plan.
- **Line 87–91 — capability grid intro:** replace "what you'd otherwise build yourself in the matching workshop" framing with explicit "same strategy, same templates, same tools we'd use — taught in a half day."
- **Line 372 — credit-back paragraph:** reframe "Either way, you leave with the strategy in writing" → "Either way, you leave with the strategy, the templates, and the tool stack in writing."
- **Line 398 FAQ — "Do I have to take the workshop first?":** tighten the answer so it positions the workshop as a true DIY enablement, not a prerequisite lecture.

### 2. `src/routes/build.tsx`
- **Line 23 — hero subhead:** replace "taught by the people who'd otherwise charge you $5K+ to build it for you" with a line that names the three deliverables (strategy, templates/tools, process) and the same "or hand it to our team" close.
- **Line 97 — "Start with the foundation workshop":** add a one-line subcopy under it (or revise the surrounding paragraph) that names the DIY playbook.

### 3. `src/routes/build.$slug.tsx`
- **Line 241 — credit-back band:** "Attended the workshop? We'll knock the {price} off…" → lead with the DIY value first: "The workshop hands you the strategy, templates, and tool stack to ship it yourself. Decide you'd rather we build it? We'll credit the {price} toward any engagement over $1,000."
- Audit the page intro and "what you get" block (around lines 30–180) for any line that still reads "learn / understand / strategy only" and rewrite to include tools + process.

### 4. `src/components/home/HomeFramework.tsx`
- **Line 177:** "The workshop gives you the story." → "The workshop gives you the story, the templates, and the tool stack to ship it." (keep the rest of the sentence.)
- **Line 223:** "Each is a half-day workshop — from $197 — or we'll build it for you." → "Each half-day workshop hands over the strategy, the templates, and the exact tool stack to DIY it — from $197 — or we'll build it for you."
- **Line 259:** "the workshop is what makes every dollar you spend on the build layer pull its weight." → tighten so it reads as "the workshop is the DIY playbook — the same one our team runs from."

### 5. `src/lib/build-workshops.ts`
- **Line 54 — FAQ "what's included":** good already (templates, worksheets, recording, follow-up). Tighten the opening clause to lead with "the strategy, the tool stack, and the step-by-step process," then list the artifacts.
- **Line 66 — FAQ "do I still need to hire you":** rewrite so the first sentence is "No — the workshop is built to let you ship it yourself," then keep the credit-back clause.

## Out of scope

- No pricing changes, no new pages, no layout changes, no new components.
- No changes to `agency-services.ts` data shape — only copy strings if they surface a "strategy only" framing (spot-check `oneLiner` fields during the pass).
- Foundation Workshop ($97) copy on the home Honest Roadmap stays as-is unless it explicitly says "strategy only."

## Acceptance

- No surface anywhere says "learn the strategy first" or implies the workshop is strategy-only.
- Every workshop CTA/chip/banner names at least two of: **strategy, templates/tools, process/playbook**.
- Tone stays in the conversion-copywriter voice already established (punchy, second-person, no fluff).
