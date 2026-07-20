## Plan: "We build the real thing in the room" copy audit

### The problem
Copy across the site (and the funnel report, and the chatbot knowledge) keeps describing the workshop like an educational product: **framework, blueprint, plan, roadmap, playbook, deliverables, documents, "you leave with a plan," "you'll walk away with."** That language sells the *idea* of building — not the actual **built product, live URL, priced offer, working tools, real creative, and hands-on-in-the-room artifacts** the attendee walks out with.

The differentiator we need to make felt: *by the time you leave, real things exist that didn't exist when you walked in — a live page, a priced offer, a working checkout, a first message sent, real creative in hand.*

### Verified current-state hits (from grep — not exhaustive; a full sweep is Phase 1)
- `src/lib/chatbot-knowledge.ts`: "Founder Playbook + Roadmap," "framework — the sequence a business actually needs," "framework-driven, done-with-you," "Avoid weak stand-ins for the Method: 'a framework,'" (tone rules contradict themselves), "deliverables," "documents."
- `src/routes/webinar.tsx`: "assets that back the plan," "the done-with-you playbook."
- `src/components/home/AccessModeDialog.tsx`: "we build your plan together," "Same plan. Same two weeks."
- `src/components/facilitator/FacilitatorPillars.tsx`: "Frameworks pulled from shipping…the same playbook."
- `public/adam-funnel-v1.md`: repeated "plan," "framework," "playbook," "documents," "you leave with a receipt…written plan," "Operator Appendix…working documents."
- Likely more in `/build`, `/services`, `/one-on-one`, `/schedule`, `/contact`, `HomeFramework`, `RegisterFramework`, `Footer`, and `supabase/functions/venture-chatbot/knowledge.ts`.

### Language rules (the audit standard)

**Replace planning nouns with built-thing nouns.**

| Avoid | Use instead |
|---|---|
| plan, roadmap, blueprint, playbook, framework (as the offer) | your live page, your priced offer, your first message sent, your working checkout, your real creative |
| deliverables, documents, PDFs, worksheets, templates | the actual pieces of your startup — page, offer, pricing, first customer, first campaign |
| "you'll leave with a plan" / "walk away with a framework" | "you leave with the thing built — live page, priced offer, first outreach sent" |
| "we build your plan together" | "we build your startup together — the real page, the real offer, the real first sale" |
| "learn / workshop / training / curriculum" | "build session," "we build it with you," "hands-on in the room" |
| "strategy / strategic" | "the actual moves — priced, live, sending" |

**Keep** "the 14-Day Pivot Method" (the *how*), "the room," "in one focused morning," "done-with-you." These are process/format words, not deliverable words.

**Allowed uses of "framework"**: only as a *component inside the method* (e.g., "the pricing framework we run in the room"), never as the top-level offer. This rule already exists in `chatbot-knowledge.ts` — enforce it everywhere.

**Proof pattern**: every claim about what you get should name a **verifiable artifact** ("a live URL by lunch," "a Stripe link that takes real money," "the first outreach message sent from your inbox before you leave") — not a category noun.

### Phase 1 — Full audit sweep
Grep every marketing surface for the avoid-list and produce an edit list. Sources to sweep:

- `src/routes/`: `index.tsx`, `build.tsx`, `build.$slug.tsx`, `services.tsx`, `schedule.tsx`, `webinar.tsx`, `one-on-one.tsx`, `facilitator.tsx`, `contact.tsx`, `register.tsx`, `signup.tsx`, `login.tsx`, `privacy.tsx`, `terms.tsx`.
- `src/components/home/*`, `src/components/facilitator/*`, `src/components/register/*`, `src/components/site/{Header,Footer,AskConcierge}.tsx`, `src/components/brand/*`.
- `src/lib/`: `chatbot-knowledge.ts`, `build-workshops.ts`, `launch-14day-plan.ts` (visible marketing strings only, not internal keys), any content-engine copy files.
- `supabase/functions/venture-chatbot/knowledge.ts` + system prompt in `index.ts` (`SYSTEM`).
- `public/adam-funnel-v1.md` and the funnel report PDF regen.
- `index.html` `<title>` / `<meta description>` and any route-level `useDocumentTitle` calls.

Explicitly **out of scope** (internal, not user-facing): admin routes under `_authenticated/_admin`, dashboard workflow keys, DB column names, `venture_document_types`, `LAUNCH_14DAY_PLAN.assetKeys`, `deck_slide_overrides`, and other internal identifiers.

### Phase 2 — Rewrite hero + primary CTAs first
Highest-impact surfaces, in order:

1. `src/components/home/HomeFramework.tsx` — hero eyebrow, H1, sub, pricing sidebar, "what happens in the room" section.
2. `src/components/home/AccessModeDialog.tsx` — "we build your startup together — the real page, the real offer" replaces "we build your plan together."
3. `src/routes/build.tsx` + `build.$slug.tsx` — workshop cards, "what you build" (not "what you learn"), FAQ.
4. `src/routes/webinar.tsx` — bullets, agenda, opt-in copy.
5. `src/routes/services.tsx`, `/one-on-one`, `/schedule`, `/facilitator`, `/contact`.
6. `src/components/site/Footer.tsx`, `Header.tsx` nav labels/tooltips.
7. `src/components/site/AskConcierge.tsx` starter prompts.

### Phase 3 — Rewrite the chatbot brain
- `src/lib/chatbot-knowledge.ts` and `supabase/functions/venture-chatbot/knowledge.ts` + `SYSTEM` prompt in `venture-chatbot/index.ts`.
- Resolve the contradiction: the tone rules say "avoid weak stand-ins like 'a framework'" but the FAQ body then calls Startup Labs "a framework." Rewrite the FAQ answers to describe the *built artifacts* and reserve "framework" for internal components.
- Update starter prompts and any answer templates so responses lead with the built thing ("You leave with a live page at your domain, a priced offer, and your first outreach sent") not with document counts or "assets."

### Phase 4 — Funnel report + external assets
- Rewrite `public/adam-funnel-v1.md` per the same rules (biggest offenders: Sections "You leave with a receipt," "Operator Appendix," "written plan," "framework").
- Regenerate the PDF at `/mnt/documents/startuplabs-funnel-report-v4.pdf`.
- Update `.lovable/startuplabs-funnel-report.md` in sync.

### Phase 5 — Guardrails so this doesn't regress
- Add a short **copy standards** block to `CLAUDE.md` (and mirror in `.lovable/`) listing the avoid-list, the allowed uses of "framework," and the "name the built artifact" rule.
- Save a project memory (design/preference) capturing the same rules so future edits inherit them.
- Add a lightweight lint idea (optional, note-only): a repo grep script under `.lovable/scripts/` that flags the avoid-list words inside `src/routes/`, `src/components/{home,site,facilitator,register}/`, `src/lib/chatbot-knowledge.ts`, and `public/adam-funnel-v1.md`.

### Phase 6 — Visual QA
Playwright screenshots of Home, `/build`, `/build/:slug` (one), `/services`, `/webinar`, `/schedule`, `/facilitator`, `/one-on-one`, `/contact`, plus the chatbot open state and the AccessMode dialog. Scan each screenshot for lingering "plan / framework / playbook / deliverables / documents / walk away with" phrases.

### Acceptance criteria
- No user-facing surface describes the offer as a plan, blueprint, framework, playbook, roadmap, deliverables package, or a stack of documents.
- Every "what you leave with" statement names at least one **built artifact** (live URL, priced offer, working checkout, first message sent, real creative in hand).
- "Framework" only appears as a component word inside the method, never as the top-level offer noun.
- Chatbot answers lead with the built thing, not with counts of assets/documents.
- Funnel report v4 PDF + `public/adam-funnel-v1.md` reflect the same voice.
- Internal identifiers (DB columns, workflow keys, admin UI) are untouched.
