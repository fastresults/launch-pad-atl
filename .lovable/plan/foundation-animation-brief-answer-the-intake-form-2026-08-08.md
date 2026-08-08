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

## Attendee-facing Foundation brief (added section in the same file)

A complete brief written for someone who has registered for a Startup Labs Foundation workshop — what the stage is, what they do in the room, and what they leave with. It goes in the same markdown file under its own heading so the animator has the substance, not just the specs.

Contents:

- **What Foundation is** — Stage 01, the bedrock every defensible startup is built on. The one drafting stage: the attendee writes the one-page story of their startup with worksheet support and AI sharpening. Every stage after Foundation switches to mentored working sessions that inherit and pressure-test this language.
- **Before you arrive** — bring the idea, an open laptop, and any existing copy; no prep deck required.
- **In the room (25-min core block)** — draft the Foundation four in this order: the "why customers pick you" line using the [Who] + [Problem] + [Outcome] + [Unfair advantage] frame; vision and mission side by side; the problem named in the customer's own words; then the one-page story last, as a distillation of the other three.
- **The eight assets you walk out with** — each with the plain-English "what it is / what it changes for you" line already written on the site:
  1. Your one-page story
  2. What you stand for
  3. The problem you solve
  4. Why customers pick you
  5. Your day-by-day launch plan
  6. Your AI toolkit, picked for you
  7. 25 ready-to-use AI prompts
  8. Your weekly rhythm
- **Where the work lives** — every asset lands on the attendee's dashboard under the Foundation stage immediately, editable forever, and every downstream stage reads from it.
- **The first 48 hours after** — paste the "why customers pick you" line into the homepage hero; test the one-page story on three people who fit the buyer profile and refine where they get confused.
- **How you know it worked** — a stranger can repeat your one-liner back to you correctly.

## Screenshots note

The form also asks for screenshots of the section. Markdown can't carry image uploads — the file will instead point to the live section URL and describe the section layout precisely, so whoever animates it has the visual reference in words. Say the word if you'd rather I also drop captured PNGs into `public/`.


## Technical notes

- Content sourced from `src/lib/framework-deliverables.ts` (stage 01) and `src/lib/curriculum-data.ts`.
- Design tokens read from `src/styles.css`; stage mark style from `src/components/home/StageSketch.tsx`.
- No app code changes — one new static file in `public/`.
