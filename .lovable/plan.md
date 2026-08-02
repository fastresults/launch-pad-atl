## Published Hero Scale Correction

### Confirmed root cause
The published page is not browser-zoomed: `html` is 16px and `body` zoom is 1. The desktop CSS itself forces the oversized composition at 1280px and above:

- Header: **60px** high
- Logo: **40px** high / approximately **206px** wide
- Headline: **52px**
- Headline and prompt width: **940px**
- Prompt card: **940 × 200px**
- CTA: approximately **171 × 49px**

These large-screen overrides explain why every element appears magnified and why the hero lacks the whitespace shown in the target.

### Implementation
1. **Remove the magnifying desktop overrides**
   - Replace the current `min-width: 80rem` rules that enlarge the logo, headline, prompt, and header.
   - Keep a single compact desktop geometry rather than scaling components up as the viewport widens.

2. **Calibrate the header to the reference**
   - Reduce header height and logo dimensions.
   - Preserve the compact 13px navigation rhythm and wide left/right gutters.
   - Ensure the navigation remains one line without increasing the overall header scale.

3. **Reduce the complete hero stack proportionally**
   - Scale down the headline, prompt width/height, inner padding, input text, CTA, kicker, and “Now building” label together.
   - Target a prompt around **760–820px wide** and **140–155px high** on standard desktop, rather than 940 × 200px.
   - Keep the headline visually prominent without exceeding the reference proportions.

4. **Restore intentional whitespace and placement**
   - Position the compact stack slightly above the hero’s vertical center, matching the supplied reference.
   - Use viewport-height-aware spacing so short laptop screens and taller desktop screens preserve the same visual balance.
   - Avoid transforms or fixed offsets that make the stack drift toward the top or bottom.

5. **Keep tablet and mobile independent**
   - Preserve the existing responsive structure below desktop.
   - Add explicit compact-desktop and wide-desktop bands only where needed, without reintroducing size growth on wide monitors.

6. **Validate the actual published geometry**
   - Check local and published output at **1280×720, 1576×1043, and 1920×1080**.
   - Measure header, logo, headline, prompt, and CTA bounding boxes—not just visual screenshots.
   - Compare screenshots against the target for whitespace, scale, glass treatment, and vertical placement before declaring completion.
   - Publish the corrected build and repeat the same measurements on the public domain to confirm the deployed CSS matches local output.