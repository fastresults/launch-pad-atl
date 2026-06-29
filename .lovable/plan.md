## Problem

The generated Brand Style Guide renders the **Voice Spectrum** (and similar 5-trait scales) as raw ASCII sliders like `|---|---|---|--•|`. This is a Gemini-ism — it tries to draw a slider in plain text. In the rendered Markdown it looks broken: unaligned pipes, dot characters, no visual meaning, and it breaks word-wrap on narrow viewports. It also exports poorly to DOCX.

The root cause is in the `generateGuide` prompt in `supabase/functions/venture-brand-wizard/index.ts`, Section 2 ("Personality & Voice — 5-trait spectrum"). The prompt asks for a "spectrum" without specifying the output shape, so the model invents ASCII art.

## Fix

**1. Forbid ASCII art / decorative characters in the style guide prompt.**

Add a global formatting contract at the top of the `generateGuide` system prompt:
- No ASCII sliders, bars, gauges, meters, sparklines, or pseudo-graphics built from `|`, `-`, `–`, `—`, `•`, `·`, `=`, `*`, `▮`, `▯`, `█`, `░`, `▰`, `▱`, `○`, `●`, etc.
- No "drawn" scales of any kind in body copy.
- Use Markdown tables for any structured comparison.
- Use plain prose for everything else.

**2. Replace the "5-trait spectrum" instruction in Section 2 with a concrete table spec.**

Change Section 2 from "5-trait spectrum, do/don't, 3 before/after copy rewrites" to require this exact Markdown table shape:

```text
| Trait | Left pole | Score (1–5) | Right pole | How it shows up |
|---|---|---|---|---|
| Direct vs Vague | Direct | 4 | Vague | one-sentence example |
```

- Score is a single integer 1–5 (1 = far left pole, 5 = far right pole).
- No visual slider, no dots, no pipes-as-art.
- Followed by a separate `### Do` / `### Don't` subsection (bulleted) and a `### Before / After` subsection with 3 rewrites in fenced quote blocks.

**3. Apply the same "tables only, no ASCII" rule to other at-risk sections.**

- Section 3 (Color System): already a table — reinforce "no swatch art, no `█` blocks".
- Section 4 (Typography): already a table — reinforce "no font-size visualizations in ASCII".
- Section 8 (Motion): require a table for easing/duration, not drawn curves.

**4. Light client-side sanitizer as a safety net.**

In `src/lib/brand-guide-docx.ts` and the inline `RichMarkdown` preview path, add a small pre-processor that strips lines matching the ASCII-slider pattern (`/^\s*[•·\-–—|=*▮▯█░▰▱○●\s]{6,}$/` with at least one `|` or bullet glyph), so legacy guides already saved in the DB also render cleanly. Pure Markdown table separators (`| --- | --- |`) are preserved by requiring the line to NOT start with `|` followed by spaces+dashes+pipes only — i.e. detect the slider shape specifically (mix of `|` and `•`/`·` with no table cells).

## Files touched

- `supabase/functions/venture-brand-wizard/index.ts` — rewrite `generateGuide` prompt (formatting contract + Section 2 table spec + reinforcement on §§3/4/8).
- `src/lib/brand-guide-docx.ts` — add `stripAsciiSliders()` pass before parsing Markdown into DOCX.
- `src/components/markdown/RichMarkdown.tsx` (or wherever the wizard previews the guide) — same sanitizer on the preview path so existing kits look right immediately.

## Out of scope

- Re-generating already-locked guides automatically. Users can click **Regenerate Style Guide** to get the new format; the sanitizer keeps the old ones legible in the meantime.
