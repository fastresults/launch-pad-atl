## Audit: "Review the brief" for novice founders

### What's wrong today (Step 3 = `ReviewStep`)

The page currently renders, top-to-bottom, in one long scroll:

1. Page title + intro
2. **Founder & Market card** — 12+ inputs (name/email/phone/country/city/region/scope/industry/sub-industry) **plus the entire 7-card Track grid duplicated here**
3. **Research panel** — sources, citations, raw artifacts
4. **Concept Studio** — refine + lock the concept
5. **Business Foundation** card — 6 fields (company, founder, location, industry, concept, problem)
6. **Target Market & Value** card — 4 fields
7. **Business Model & Operations** card — 4 fields
8. **Growth & Vision** card — 4 fields
9. Save / Continue buttons (Continue blocked until concept is locked)

Total: **~35 editable fields in one scroll**, no progress signal, the most important action (lock concept) is buried in the middle, and the gating message ("Lock your concept in Concept Studio above") only appears at the very bottom next to the disabled button. The Track picker also duplicates what they already chose on Step 1 — for a novice this reads as "did I do it wrong?" rather than "you can change it."

Plus four content problems specifically for novices:

- **No "what is this and why does it matter"** at section level — `Business Foundation` / `Target Market & Value` / `Operations` / `Vision` are jargon.
- **No completeness signal** — they can't tell what's empty without scrolling and reading every field.
- **No "good enough" affordance** — every field looks equally important.
- **Founder & Market is already locked-in from Step 1** but re-rendered as a giant editable card here, suggesting they have to redo it.

---

## Recommendation: 4 guided sub-steps with a sticky checklist

Keep the outer 4-step stepper (Your idea → Research → Review → Write) — that part is already novice-friendly. Reshape **inside** Review into a guided sub-flow.

```text
┌──────────────────────────────────────────────────────────┐
│ Step 3 of 4 — Review the brief                           │
│ Confirm what we got right. Fix what's off. Then continue. │
│                                                          │
│  ●━━━━○━━━━○━━━━○━━━━○      [ Save & exit ]              │
│  3.1   3.2  3.3  3.4  3.5                                │
│  Setup Story Market Model Lock                           │
└──────────────────────────────────────────────────────────┘
```

Five focused sub-screens. **One screen, one decision.** Each sub-screen has a "Next" button at the bottom; the sticky sub-stepper at top lets advanced users jump around.

### 3.1 — Confirm your setup *(was Founder & Market)*
**Goal:** "Is this still you and your market?"

- Render as a **read-only summary card**, not a form, with one "Edit details" button that flips it into the form.
- Show: Founder name + email, City/Region/Country, Market scope, Industry, **Track chip**.
- **Remove the duplicate Track grid.** Add a small "Change track" link that opens the picker in a modal — they made this choice on Step 1, don't make them re-make it inline.
- Empty/missing fields get a yellow dot and a "Add this" inline call-to-action.
- "Looks right — next" button at the bottom.

### 3.2 — Your story *(was Business Foundation)*
**Goal:** "Confirm what you're building and the problem."

- Rename "Business Foundation" → **"Your story"**.
- Show only 3 fields: **Concept**, **Problem you solve**, **Company name**. Move `founder_name`, `location`, `industry` out — they already live in 3.1; surface them here as locked summary chips with "edit in setup" links, not as duplicate inputs.
- Each field gets a one-line helper: e.g. "In one paragraph, what would you tell a stranger at a coffee shop?"
- Field-level "Looks good" checkmark a novice can tap; that's what drives the completeness signal in the sub-stepper. Empty-but-not-confirmed = amber dot; confirmed = green check.

### 3.3 — Your market *(was Target Market & Value)*
Same pattern, 4 fields. Helper text examples written in plain English:

- *Target customers* — "Who specifically pays you? Not 'everyone' — be embarrassingly specific."
- *Value proposition* — "Finish this sentence: We help ___ do ___ without ___."
- *Differentiators* — "What would a customer say when their friend asks 'why them instead of X'?"
- *Market size* — "Rough number is fine. 'Local: ~5k households' is better than blank."

### 3.4 — Your model *(merge Operations + Vision)*
Merge the two weakest sections. Novices freeze when they see "Mission" and "Vision" as separate fields next to "Revenue model" and "Pricing." Reorganize into two collapsible groups:

- **How you make money** — Revenue model, Pricing
- **Where you're going** *(collapsed by default)* — Short-term goals, Long-term goals, Mission, Vision

Key processes + Team get a "Skip for now" affordance — they're optional for first-pass document generation.

### 3.5 — Lock your concept
This is the only screen that gates progression today, but right now it's buried as "Concept Studio" mid-page. Promote it to its own sub-step:

- Big card showing the current concept + value prop.
- One primary action: **"Lock concept & continue to documents"**.
- Secondary: "Refine with AI" (opens existing Concept Studio inline).
- Tertiary collapsed: "View research sources" (the existing `ResearchPanel`, demoted from the main scroll).
- Once locked, this sub-step shows a checkmark and the Continue button at the very top of the page becomes enabled — no more "you can't continue, scroll up to find why."

---

## Cross-cutting novice fixes

1. **Sticky sub-stepper with completeness dots.** A novice sees at a glance: "I'm on 3.2, I've done 3.1, three more to go."
2. **One decision per screen, one primary CTA.** Today's page has 3 primary-looking buttons (Save in Founder card, Save draft, Continue).
3. **Helper text under every field**, written in plain English, with one concrete example. No empty labels.
4. **Confirm-don't-rewrite framing.** Default state of every drafted field is "✓ Looks right" + "Edit." This matches the user's actual job (review) instead of asking them to re-type.
5. **Demote `ResearchPanel`** from the main flow into a "Where this came from" disclosure inside 3.5. Novices don't need raw citations to make decisions; they need them on demand for trust.
6. **Move the Track decision out** of this page entirely. It lives on Step 1 and on the snapshot card — surface it here as a chip with an edit affordance, not a 7-card grid.
7. **Auto-save on blur**, kill the "Save draft" button. Show a tiny "Saved 2s ago" timestamp next to the sub-stepper. Reduces the number of buttons on screen and the fear of losing work.
8. **Field-level "good enough" hint.** For each multi-line field, show a faint character-count target like "~40-120 words is the sweet spot." Removes the "is this enough?" anxiety.
9. **Continue button promoted to a sticky bar** at the bottom of the viewport on every sub-step. Always visible, disabled with a tooltip explaining what's missing ("Lock your concept on step 3.5") rather than a small amber text line.

---

## Files this would touch

- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — split `ReviewStep` into a `<ReviewWizard>` with 5 sub-step components, sub-stepper component, sticky CTA bar, auto-save, completeness state.
- `src/components/hub/ReviewSetupSummary.tsx` (new) — read-only Founder/Market summary + edit-in-modal.
- `src/components/hub/ReviewSubStepper.tsx` (new) — sticky 5-dot progress.
- `src/components/hub/FieldHelp.tsx` (new) — label + helper-text + confirm-checkmark wrapper used by every field.
- Helper-text strings centralized in `src/lib/reviewCopy.ts` so they can evolve without touching JSX.
- No DB changes. No edge-function changes. Pure UX refactor of the Review step.

### Out of scope for this pass

- Mobile layout work (page is desktop-first today; sub-stepper would render as a horizontal swipe on mobile — separate plan).
- AI-suggested field rewrites ("Looks weak — let AI tighten it") — tempting but adds scope; the existing Concept Studio already covers concept-level refinement.
- Per-track field variations (e.g. hiding "Pricing" for a nonprofit) — defer; track tone already shapes the *output*.
