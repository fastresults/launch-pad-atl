# Fix: "Continue to track" stays greyed out after pasting a concept

## What's actually happening

The button is not broken — step 2 is blocked by an **empty Company name**, which the footer says in small grey text ("Still needed: Company name") next to a field that is several screens above the paste box. Two real problems behind that:

1. **Pasting a concept never triggers extraction.** The AI synthesis that fills company name, founder, city, region, country and industry only runs automatically when a *new source* (file, URL, voice) becomes ready. Typing or pasting text straight into the Business concept box sets one field and nothing else, so every other required field stays empty and the gate never opens.
2. **The blocker is unactionable.** The missing-field message is plain text — not clickable, and the offending field is not highlighted, so from the paste box the user has no way to see or reach what's wrong.

## The fix

**1. Extract from a pasted concept.**
When the concept box loses focus (or after a short pause in typing) and the text is substantial (200+ characters) and at least one required field is still empty, run the same synthesis pass with the concept as the source. It only fills fields that are currently empty — never overwrites anything the user typed. While it runs, the footer shows "Reading your concept…" and Continue stays disabled, matching the step 1 behaviour. A visible "Extract details from this text" button sits next to the character counter so it can also be triggered on demand.

**2. Make the blocker reachable.**
Turn the "Still needed" list into clickable chips. Clicking one scrolls to that field and focuses it. Each still-missing required field also gets a red outline and a short "Required" note, so it's obvious on the way past.

**3. Keep the guard honest.**
No required field is removed — a venture still needs a company name. If synthesis can't infer one, the field is focused with a hint ("We couldn't find a name in your text — what's it called?").

## Technical notes

Single file: `src/routes/_authenticated/dashboard/hub.new.tsx` (plus small prop additions to `StepNav` in `src/components/hub/VentureWizard.tsx` for clickable chips).

- Add `conceptExtract()` — reuses `draftFromFiles`'s call to `venture-synthesize-concept` with `conceptDraft` only, but with a `fillEmptyOnly` flag so `setIf`/`setIdentity` skip fields that already have a value, and it does **not** overwrite `businessConcept` with the model's rewrite.
- Trigger: `onBlur` on the concept textarea + a debounced effect (~1.2s idle), guarded by `businessConcept.trim().length >= 200`, `missingStep2.length > 1`, `!drafting`, and a ref holding the last-extracted text so the same paste never runs twice.
- `StepNav` gains an optional `blockedItems: {key,label,onClick}[]` rendered as chips; `hub.new.tsx` passes `missingStep2` mapped through the existing `jumpTo(key)` helper (which already resolves `registerRef` targets).
- Missing-field styling: derive a `missingKeys` Set from `missingStep2` and apply `aria-invalid` + a danger ring class on those inputs.

No backend, schema, or edge-function change — `venture-synthesize-concept` already accepts a concept-only payload.
