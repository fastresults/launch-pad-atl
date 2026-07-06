## Goal

Replace the brand/authority handle **"The Anderson Framework"** with **"Adam Anderson's Startup Process"** everywhere it currently appears. Keep the three-phrase system intact — just swap the middle handle.

## Updated three phrases

| Phrase | Job |
|---|---|
| **The 14-Day Launch Method** | Offer name — what you buy |
| **Adam Anderson's Startup Process** | Brand / authority handle — whose playbook it is |
| **the done-with-you method replacing accelerators, courses, and raw AI** | Category descriptor / positioning line |

Reads naturally without the "method / method" or "method / framework" collision, and puts Adam's full name in the headline for authority.

## Files to edit

Straight phrase swap — `The Anderson Framework` → `Adam Anderson's Startup Process`:

1. **`src/components/home/HomeFramework.tsx`** (line 100)  
   *"The 14-Day Launch Method is **Adam Anderson's Startup Process** in one focused morning — the done-with-you playbook quietly replacing accelerators, courses, and raw AI…"*

2. **`src/routes/webinar.tsx`** (line 40)  
   *"**Adam Anderson's Startup Process**, run live over video in a small cohort with the founder who built it —"*

3. **`src/routes/one-on-one.tsx`** (line 85, H1 second line)  
   *"**Adam Anderson's Startup Process**, run for you by Adam and his team."* — since Adam's name now leads the headline, tighten the follow-on clause to *"run for you by his team."* to avoid saying "Adam" twice.

4. **`src/routes/services.tsx`** (line 45, H1)  
   *"Scale with **Adam Anderson's Startup Process** that launched you."*

5. **`src/routes/build.tsx`** (line 21, H1)  
   *"Scale it with **Adam Anderson's Startup Process** — one morning at a time."*

6. **`src/lib/chatbot-knowledge.ts`**
   - Line 201 (brand vocabulary bullet): rename the handle, update banned-variants list to include *"Anderson Framework," "Anderson Method," "Adam's Process," "the Anderson system."*
   - Line 207 (guardrail): "Reach for **Adam Anderson's Startup Process** in headline-style openers and authority moments."
   - Line 220 (framework guardrail): drop the "Anderson Framework" exception — restore the original "framework only describes a component inside the Method" rule. The brand handle no longer uses the word framework, so no exception is needed.

## What does NOT change

- Meta titles, URL slugs, buttons, pricing, agenda headers stay on **The 14-Day Launch Method**.
- The done-with-you positioning tagline stays verbatim.
- Component filename `HomeFramework.tsx` stays.
- Noun uses of "operator" for Adam and session lenses stay.
- Funnel report untouched.
- No visual or layout changes.

## Verification

1. `rg -i "anderson (framework|method)" src` returns zero hits.
2. `rg "Adam Anderson's Startup Process" src` shows six placements.
3. Home hero paragraph reads with no repeated-word stutter.
4. `/one-on-one` H1 doesn't say "Adam" twice.

## Out of scope

- Renaming the offer, adding new pages, restructuring layouts.
- Editing the funnel report/PDF.
