## Date corrections for the Free Founder Selection offer

Apply the new dates everywhere in the selection-variant copy:

- Application deadline: **June 20, 2026** (was July 8)
- Decisions emailed (both seats and Founder's Discount): **July 8, 2026** (was July 15)
- Workshop day: **July 23, 2026** (unchanged)

Per your clarification, both the six winners and the Founder's Discount go out the same day — **July 8** — so every "July 15" reference becomes "July 8".

## Files to edit

### 1. `src/components/home/HomeSelection.tsx`
- L62 hero: "Apply by July 8" → "Apply by **June 20**"
- L70 sub-hero: "Decisions emailed July 15" → "Decisions emailed **July 8**"
- L275 timeline "Applications close": `July 8, 2026` → `June 20, 2026`
- L276 timeline "Selections announced": `July 15, 2026` → `July 8, 2026`
- L277 timeline "Founder's Discount emailed": `July 15, 2026` → `July 8, 2026`
- L333 Founder's Discount paragraph: "emailed July 15" → "emailed **July 8**"
- L356 fine print: "code on July 15" → "code on **July 8**"
- L434 bottom CTA: "Decision by July 15" → "Decision by **July 8**"

### 2. `src/components/register/RegisterSelection.tsx`
- L91 sub-hero: "chosen by July 15" → "chosen by **July 8**"
- L100 trust strip: "Decision by July 15 — every applicant hears back" → "Decision by **July 8** — every applicant hears back"
- L270 form footnote: "hear from us by July 15" → "hear from us by **July 8**"
- L334–335 SuccessCard: "Between now and July 15, 2026… On July 15…" → "Between now and **July 8, 2026**… On **July 8**…"
- L346 SuccessCard: "Watch the inbox on July 15" → "Watch the inbox on **July 8**"
- (No change to L43/L237/L206 — those are the July 23 workshop date.)

### 3. Add an apply-by line to the register page
Currently RegisterSelection never states the June 20 deadline. Add it to the sub-hero (L89–94) so applicants see it before they start: append "Applications close **June 20, 2026**." to that paragraph.

## Not touched
- `src/routes/index.tsx`, `src/lib/cohorts.ts`, `src/lib/curriculum-data.ts`, `src/lib/applications.functions.ts`, `admin.site.tsx` — only reference July 23 (workshop date), which is unchanged.
- The paid `HomePage` / default register flow — this offer copy lives in the selection variant only.

## Verification
After edits, re-grep for `July 8`, `July 15`, and `June 20` in `src/components/home` and `src/components/register` to confirm: zero remaining `July 15`, the only `July 8` references are the new decision-date ones, and `June 20` appears as the application deadline in both hero copy and the timeline.
