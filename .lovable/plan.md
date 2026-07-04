# Unify the site around The 14-Day Launch Method

## The single message

- **Name (always capitalized, always the same):** The 14-Day Launch Method
- **Positioning line (one-liner that follows the name):** The operator-led method replacing accelerators, courses, and raw AI.
- **Old-way / new-way frame:** the old way is a year of courses, an accelerator seat, or a raw-AI rabbit hole. The new way is one live morning inside The 14-Day Launch Method — an operator running a proven playbook, first customer named, first channel open, revenue in two weeks.
- **Movement language to sprinkle (not overuse):** "quietly taking over," "modern founders are using," "the method behind the momentum."

## Language rules for this pass

- Replace generic "framework" copy with **The 14-Day Launch Method** where it's positioning the offer. Keep the word "framework" only where it describes a *component inside* the method (e.g. "the pricing framework we run in the room") — never as the top-level thing being sold.
- Kill weak stand-ins: "a real framework," "a proven system," "our process," "our method" → replace with the named phrase.
- Never say "template." (Existing rule.)
- Never say "business" in place of "startup" in user-facing copy. (Existing rule.)
- Every hero, sub-hero, and primary CTA block on marketing pages should reference the Method by name at least once.

## Files to rewrite (full unification pass)

**Marketing pages — hero + sub-hero + CTA blocks:**
- `src/components/home/HomeFramework.tsx` — lead hero, framework section, CTA band. Method named in the eyebrow and again in the CTA.
- `src/components/register/RegisterFramework.tsx` — rewrite the "what you're registering for" language around the Method.
- `src/routes/webinar.tsx` — hero, HIGHLIGHTS array, cohort card copy.
- `src/routes/one-on-one.tsx` — reframe as "The 14-Day Launch Method, run one-on-one with Adam."
- `src/routes/services.tsx` — position agency services as "the same assets we ship inside The 14-Day Launch Method."
- `src/routes/build.tsx` and `src/routes/build.$slug.tsx` — subhead + CTA.
- `src/routes/schedule.tsx` — intro paragraph.
- `src/routes/facilitator.tsx` shell (via components below).

**Facilitator surface:**
- `src/components/facilitator/FacilitatorHero.tsx`
- `src/components/facilitator/FacilitatorStory.tsx`
- `src/components/facilitator/FacilitatorPillars.tsx`
- `src/components/facilitator/FacilitatorAudience.tsx`
- `src/components/facilitator/FacilitatorCTA.tsx`

**Shared UI copy:**
- `src/components/home/AccessModeDialog.tsx` — three formats framed as "three ways to run The 14-Day Launch Method."
- `src/components/site/Header.tsx` — only if a tagline/nav label references "framework."

**Meta + concierge:**
- `index.html` — `<title>`, `<meta name="description">`, `og:title`, `og:description`, `twitter:title`, `twitter:description` all lead with the Method name and positioning line.
- `src/lib/chatbot-knowledge.ts` and `supabase/functions/venture-chatbot/knowledge.ts` — teach the concierge the name, the one-liner, and the old-way/new-way framing so every bot answer reinforces it.

## Explicitly out of scope

- Workshop slide components under `src/components/workshop-slides/` — internal, in-room use.
- Dashboard / authenticated routes under `src/routes/_authenticated/`.
- Admin routes.
- `src/lib/framework-deliverables.ts`, `src/lib/workflow.ts`, `src/lib/business-ideas.ts`, `src/lib/schedule-data.ts` — data/logic, not marketing voice.
- Legal pages (`terms.tsx`, `privacy.tsx`).

## How I'll write the copy

- Every marketing hero gets the same shape: **eyebrow** ("The 14-Day Launch Method") → **headline** (outcome, not feature) → **sub** (old way vs. new way, one sentence) → **CTA** (verb + Method).
- Concrete over vague: "first paying customer in 14 days," "offer priced by lunch," "outreach going out that afternoon" — never "get results faster."
- One repeated closer across pages: *Not another course. Not raw AI. The operator-led method replacing both.*
- No emoji, no hype adjectives ("revolutionary," "game-changing"). The name + the specificity is the marketing.

## Verification

After the rewrite I'll grep for stray uses of "a framework," "our framework," "the framework," "a proven system," and "our method" in the files above to confirm nothing generic slipped through, and confirm `index.html` meta + chatbot knowledge both lead with the Method name.
