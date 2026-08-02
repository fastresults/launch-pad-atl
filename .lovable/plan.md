## What I actually measured (not a guess)

I measured the hero on both the local preview and the live site at your screen size. Both serve **identical, on-spec numbers**: 52px header, 42px title, 800×152 prompt, no zoom, no transforms. So the CSS "fix" is deployed and working.

But that's exactly the bug. Here's the share of screen width the hero takes at different window widths:

```text
window width   title width   prompt width
1000 px          60%           80%     <-- looks hugely zoomed in
1100 px          54%           73%
1280 px          47%           62%
1576 px          38%           51%     <-- matches your reference mockup
1920 px          31%           42%
```

Your reference screenshot has the prompt at roughly **half** the screen width. The screenshot you just sent has it at roughly **80%** — which is exactly what a fixed 800px prompt looks like in a **~1000–1030px-wide viewport** (the Lovable preview pane, or a non-maximized browser window). Nothing is magnified. The elements are frozen at one absolute size while the window around them shrinks.

Every previous attempt "passed" because I verified absolute pixels at wide viewports. That test can never catch this. The composition was never pinned; only the pixel numbers were.

## The fix

Stop freezing pixels. Freeze **ratios**, so the composition looks like your reference at 1000px, 1280px, 1576px and 1920px alike.

1. **Proportional hero geometry** in `src/styles.css` (`sl-` scope only):
   - Prompt panel: width `min(800px, 52vw)` with a sensible floor, so it holds ~50–52% of the window at every desktop width instead of ballooning to 80%.
   - Title: fluid `clamp()` keyed to viewport width, tuned so it lands at ~38% of window width across the range (about 30px at 1000px, 42px at 1576px).
   - Kicker, status line, footer text and submit button scale on the same curve so internal spacing stays proportional.
   - Header stays 52px tall (a fixed chrome bar is correct); logo and nav type get a mild fluid step so they don't crowd at 1000px.

2. **Rewrite the regression gate** (`scripts/hero-geometry.py`) to assert **percentage of viewport width**, not absolute pixels — title 36–41%, prompt 49–54%, at 1000/1100/1280/1440/1576/1920 and at DPR 1.8. Absolute-pixel assertions get deleted; they are what let this ship four times.

3. **Visual proof before any claim**: capture the hero at 1000px and 1576px and compare side by side against your reference screenshot. I will show you both images in chat and will not say "fixed" until you've seen them.

## Technical notes

- No component logic changes — this is `src/styles.css` plus the test script.
- The stale-cache work from the last turn stays; it was a real (separate) issue but not the cause of what you're seeing now.
- Root cause in one line: the hero was pinned to absolute pixels while the reference design is proportional, so it only ever looked right at ~1576px and looked "zoomed" everywhere narrower.
