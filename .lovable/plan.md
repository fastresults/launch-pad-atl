## v2 — Conversion-oriented Atlanta announcement (Nano Banana Pro)

Same target: `imagegen--generate_image`, `model: "premium.gemini"`, `1088×1920`, save to `/mnt/documents/atlanta-six-announcement-v2.png` (keep v1 so you can compare side by side).

### What's changing vs v1
The original prompt under-sold the offer. v1 buried "free" inside a small info card and led with a brand line ("Six Founders. One Thursday."). v2 pulls the three highest-converting levers to the top of the visual hierarchy:

1. **Lead with FREE.** A huge typographic "FREE" or "$0" badge is the first thing the eye lands on, before the headline. Free is the offer — it should not be a footnote.
2. **Stakes + scarcity in the headline.** Replace "One Thursday" framing with a scarcity-forward line ("6 Free Seats. 1 Day. Your Startup, Launched.") so a scroller knows what's at stake in under a second.
3. **CTA promotes the upside, not the deadline.** "APPLY FREE — JUNE 20" pairs the action with the zero-cost promise; deadline is the constraint, "free" is the reason to tap.
4. **Risk-reversal microcopy.** Add a short reassurance line: "No fee to apply. No catch. Every applicant hears back." This is the highest-impact addition for conversion — it kills the "what's the catch?" objection that kills scrollers on "free" offers.
5. **Tighter info row.** Drop "LED BY A 30-YEAR STARTUP OPERATOR" from the visual (it's a credibility line, not a conversion line) and replace it with "Worth $2,500 · Yours at $0" — anchor a value so "free" lands.

### Refined prompt to send

```
A premium 9:16 vertical social media poster for Instagram, Facebook, and LinkedIn stories. Editorial design quality, conversion-optimized hierarchy, museum-grade typography. Designed by an award-winning art director who knows that on social, free is the hook and the eye has one second.

Background: deep midnight navy (#0a0a1a fading to #141432). A sweeping diagonal gradient ribbon — magenta (#e94560) → violet (#6c5ce7) → cyan (#2dd4a8) — cuts across the upper third. Subtle film grain, faint hand-drawn constellation lines in the negative space.

VISUAL HIERARCHY (top to bottom, the eye should land in this order):

1. KICKER pill at the very top, centered, thin outline, soft white uppercase letter-spaced: "ATLANTA · INAUGURAL COHORT"

2. THE OFFER — the single largest element on the entire poster: the word "FREE" set in a massive condensed display sans-serif, filled with the magenta-to-cyan gradient, with a small star/asterisk mark. Directly under it in small uppercase white: "TUITION · MATERIALS · LUNCH — ALL COVERED"

3. HEADLINE in bold sans-serif, white, two tight lines:
   "6 SEATS. 1 DAY."
   "YOUR STARTUP, LAUNCHED." — set the second line in elegant italic serif, tinted with the gradient

4. SUB-HEADLINE, medium sans, white at 90% opacity, one line: "Walk in with an idea. Walk out at 4:30 PM with a filing-ready startup."

5. RISK-REVERSAL strip in a thin rounded outline, single line, slightly smaller, white at 80%: "No application fee · No catch · Every applicant hears back"

6. INFO row, two columns separated by a vertical hairline:
   LEFT: "THU · JULY 23, 2026"  /  small line: "IGNITE Center, Norcross GA"
   RIGHT: "WORTH $2,500"  /  small line: "Yours at $0"

7. PILL CTA BUTTON, gradient fill (magenta→cyan), bold white text: "APPLY FREE — JUNE 20"
   Fine print directly below in light gray, small: "12 minutes to apply · Decisions emailed July 8"

8. ATLANTA SKYLINE silhouette anchoring the bottom — deep indigo with thin neon-cyan edge light, stylized minimal (Bank of America Plaza tower, Westin cylinder, Ponce City Market, mid-rises). Six glowing warm-white dots float as a constellation just above the skyline, connected by thin luminous lines — exactly six dots, no more, no less.

9. URL footer, centered, letter-spaced, small white: "STARTUPLABS.ONLINE"

Constraints: every element inside at least 8% safe-area padding from every edge. Nothing clips. Perfect kerning. No stock photos, no people, no clip-art icons, no emojis, no watermarks. Every word spelled correctly. Readable as a thumbnail. The word FREE must be the single most dominant element.
```

### QA after generation
- The word FREE is unambiguously the biggest, brightest element.
- All text is spelled correctly (especially "STARTUPLABS.ONLINE", "NORCROSS", "FACILITATOR" is not on this poster).
- Exactly six constellation dots.
- The pill CTA is visually intact — gradient, full text, no clipping.
- Nothing touches the canvas edges.
- If text is mangled, regenerate once with a tightened prompt rather than raster-editing.

### Delivery
Surface both files so you can pick the winner:
- `<presentation-artifact path="atlanta-six-announcement-v2.png" mime_type="image/png"></presentation-artifact>`
- (v1 is already delivered as `atlanta-six-announcement.png`)
