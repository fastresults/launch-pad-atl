
## The real problem

The per-slug data (pains, walk-outs, agenda, fit) is already unique. But the **frame copy** — eyebrows, headlines, kickers, decision-moment paragraph — is hardcoded inside `src/routes/build.$slug.tsx` and renders identically on all 8 workshops. That's the lazy part the user is calling out.

Hardcoded today (same on every slug):
- Pain section: eyebrow "What it costs to wing this" + H2 "Skip this and you'll pay for it — usually in five figures."
- Walk-outs H2: "Concrete artifacts, the tool stack, and the playbook. Not vibes…"
- Agenda H2: "One morning. Four working sessions. Real outputs by lunch."
- Fit H2 + lede: "Who this is for. And who it isn't. / We'd rather you skip this workshop…"
- Decision moment H2 + body: "Leave knowing exactly what to do next. / By 11:30…"
- Other workshops H2: "The other capabilities your business will need."
- FAQ H2: "Questions, answered straight."

## Plan

### 1. Extend `BuildWorkshop` type (`src/lib/build-workshops.ts`)

Add a `sections` object on each workshop carrying the frame copy that's currently hardcoded:

```ts
sections: {
  painEyebrow: string;          // e.g. "The cost of a weak brand"
  painHeadline: string;         // unique cost-of-inaction line per workshop
  walkOutHeadline: string;      // { lead: string; emphasis: string }
  agendaHeadline: string;       // ditto split
  fitHeadline: string;          // ditto split
  fitLede: string;
  decisionHeadline: string;     // ditto split
  decisionBody: string;         // unique "by 11:30 you'll know X" per workshop
  otherWorkshopsHeadline: string;
  faqHeadline: string;
}
```

Use `{ lead: string; emphasis: string }` for the three headlines that already render a gradient span on the second clause.

### 2. Write 8 distinct, conversion-grade frame copy sets

One per slug. Voice stays: 20-yr direct-response copywriter, second person, specific dollar/time stakes, no recycled metaphors across slugs. Examples of the *flavor* (final lines authored in build mode):

- **brand-identity** — pain H2: "A $40 logo costs you $40k in deals you'll never know you lost." Decision body about pricing power, not generic "build/hire/handoff."
- **website-that-converts** — pain H2: "Your homepage is leaking the only traffic you'll ever pay this much to get." Decision body about CVR math.
- **social-presence** — pain H2 about borrowed audiences on rented land; decision body about which two channels to actually own.
- **content-engine** — pain H2 reframed off the current "five figures" line into something specific to compounding content debt.
- **ai-as-os** — pain H2 about headcount math and the cost of human-only ops.
- **email-crm** — pain H2 about the 80% of revenue in touches 2–12 that never get sent.
- **sales-systems** — pain H2 about closing on mood vs. closing on system, with a deal-size stake.
- **legal-financial-ops** — pain H2 about being unbankable / un-fundable / un-sellable.

Each gets its own unique walk-out, agenda, fit, decision, other-workshops, and FAQ headline — no two slugs share a line.

### 3. Refactor `src/routes/build.$slug.tsx` to read from `w.sections`

Replace every hardcoded headline/eyebrow/body in the 6 sections listed above with `w.sections.*`. No layout, component, route, or pricing changes. Render the `lead` + `emphasis` split as the existing `<span className="text-gradient-brand">` pattern.

### 4. Strengthen the dev-mode drift guard

Extend the existing guard in `build-workshops.ts` to also warn if any two workshops share an identical `sections.painHeadline` or `sections.decisionBody` — so this regression can't reappear.

## Out of scope

- No changes to homepage, `/services`, `/build` index, pricing, layout, components, or the `BuildWorkshop` fields already in use (`pains`, `walkOuts`, `agenda`, `forYou`, `notForYou`, `agencyServiceTagline`, `faq`).
- No new images or sections.

## Acceptance

- Visiting any two `/build/[slug]` pages shows visibly different eyebrows, H2s, and decision-moment body — not just different bullets.
- The "Skip this and you'll pay for it — usually in five figures." line appears on **zero** slugs (or at most one, if it's the right line for that specific workshop).
- Typecheck passes; dev guard logs no drift.
