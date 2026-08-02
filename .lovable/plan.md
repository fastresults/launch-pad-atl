# Why every previous fix "worked" and you still see this

I reproduced your exact screenshots — same line breaks, same proportions — but **not at 1400px**. I had to set the browser to **1027 CSS pixels** to match them pixel for pixel.

What I verified this turn:

- The published site at `startuplabs.online` is serving the corrected stylesheet (the new scale tokens are in the live CSS bundle).
- Measured live at 1400 CSS px: header 52px, `/services` H1 47.6px, `/build` H1 47.6px, home hero H1 31.5px. Those match the preview exactly.
- Measured live at 1027 CSS px: the rendering is identical to your uploaded screenshots.

So your 1400px monitor is **not** giving the page 1400 CSS pixels. Between macOS display scaling and browser zoom, the page is being handed roughly **1024–1030 CSS pixels**. Every gate I built measured 1400 and passed; you were never looking at 1400. That is the miss.

At ~1030px the current design still looks magnified because the compact tier was never actually designed — it just inherits the wide-screen composition: content runs edge-to-edge with a ~50px gutter, body copy sits at 18px, CTA buttons are ~72px tall, the eyebrow pill spans 60% of the screen, and card headings hit ~34px.

## 1. Reproduce first, then design for the real viewport

- Lock the reference case at **1027x600 CSS px** (your actual rendering) and add 1024, 1100, and 1152 alongside it.
- Also test with browser zoom at 110/125/150% on a 1400 physical window, since that is the mechanism producing your view.

## 2. Build a genuine compact desktop tier (1024–1279 CSS px)

Separate from the wide tier, with its own token values:

- Centered content column capped around 62–66rem with real gutters (not edge-to-edge with 50px margins).
- Display headline ~30–32px (currently ~35–48px depending on route).
- Lead paragraph 16px / 1.6, measure capped near 60ch.
- Eyebrow/kicker 11px with tighter tracking so it stops spanning the screen.
- CTA buttons ~46px tall, 15px label.
- Section vertical rhythm ~3rem, card padding and card headings scaled down to match.
- Header stays 52px; nav type drops a step so it does not crowd the CTA pill.

## 3. Apply it across every public route

`/`, `/services`, `/build`, `/build/:slug`, `/schedule`, `/facilitator`, `/contact`, `/one-on-one`, `/webinar`, `/register`, legal pages — all driven by the shared tokens, no per-page overrides. The hero keeps its `sl-*` namespace but consumes the same compact-tier values.

## 4. Replace the gate that lied

- Add 1024/1027/1100/1152 to `scripts/hero-geometry.py` and `scripts/public-parity.py`.
- Assert absolute caps at the compact tier: H1 ≤ 34px, lead ≤ 16px, content column ≤ 70% of viewport width at ≥1024, CTA height ≤ 50px, eyebrow ≤ 12px.
- Fail on first-viewport density: hero H1 + prompt, or H1 + lead + CTAs, must fit within 600px of height.

## 5. Verify with screenshots at your viewport, then publish

- Capture `/`, `/services`, `/build`, `/schedule` at 1027 and 1152 and compare directly against your three uploads.
- Publish, then re-measure the live domain at 1027 and confirm both the release ID and the size caps before I report anything as fixed.

## Technical notes

- Root cause is not zoom injected by our code, a stale build, or preview/production divergence — all three were ruled out by measurement this turn. It is that the 1024–1280 CSS-px band has no dedicated composition.
- The current `clamp()` lower bounds (`2.25rem` display, `1rem` lead) are the floor being hit at 1030px; they are simply too large for that width and need to come down, with the wide-screen top end left as-is.
