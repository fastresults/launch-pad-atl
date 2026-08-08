# Foundation animation brief — answer the intake form

Create one markdown file that answers every field in the attached "Quick questions before I animate the Foundation" form, using the real Foundation content from the site.

## File

`public/foundation-animation-brief.md` (served at `/foundation-animation-brief.md`, so the other tool can fetch it directly instead of trying to read the JS-rendered site).

## What it will contain

1. **What is "Foundation" and its subcomponents** — Stage 01 of the framework, the bedrock of the build, plus its eight assets verbatim from the site:
   Your one-page story · What you stand for · The problem you solve · Why customers pick you · Your day-by-day launch plan · Your AI toolkit, picked for you · 25 ready-to-use AI prompts · Your weekly rhythm.
   Each with the one-line benefit already written for it on the site.
2. **Design system** — the brand tokens as they exist in the project: color values (background, ink, primary/accent), the display + body typefaces, corner radii, and the hand-drawn animated stage mark style used beside each stage.
3. **Video format** — 16:9 landscape (site hero/section use), with a note that a 9:16 cut is wanted for social.
4. **Length** — ~30 sec: enough to name all eight assets at ~3 sec each with an open and a close.
5. **Who it's for** — prospects visiting the site (first-time founders, Plan-B seekers, Main Street operators).
6. **Tone of copy** — punchy & bold, matched to existing site voice rules: "startup" not "business", "asset" not "document", "framework" not "template", and never framed as a plan/playbook — it's a done-with-you build.
7. **Extras the form implies** — a suggested beat-by-beat shot list and on-screen copy for the 30 seconds, plus the CTA.

## Screenshots note

The form also asks for screenshots of the section. Markdown can't carry image uploads — the file will instead point to the live section URL and describe the section layout precisely, so whoever animates it has the visual reference in words. Say the word if you'd rather I also drop captured PNGs into `public/`.

## Technical notes

- Content sourced from `src/lib/framework-deliverables.ts` (stage 01) and `src/lib/curriculum-data.ts`.
- Design tokens read from `src/styles.css`; stage mark style from `src/components/home/StageSketch.tsx`.
- No app code changes — one new static file in `public/`.
