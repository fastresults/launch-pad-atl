# Desktop-Only Deployment Experiment

## Objective
Make the public website use the desktop presentation at every reported viewport width. This is a deliberate diagnostic experiment: public pages will no longer switch to a hamburger, compact navigation, reduced typography, stacked mobile grids, or mobile-sized controls.

## What the current code confirms
- The header still contains a separate mobile navigation tree and activates it below `768px`.
- Public CSS still has three responsive states: phone below `768px`, compact desktop from `768–1023px`, and full desktop from `1024px`.
- Individual public pages still contain Tailwind responsive utilities such as `md:grid-cols-*`, `md:text-*`, `md:py-*`, and `sm:flex-row`; those can independently produce a mobile-like page even if the header is forced desktop.
- Therefore, forcing only the hamburger off would not be a valid test. The entire public surface must receive one desktop contract.

## Implementation
1. **Add an explicit desktop-only public mode**
   - Mark public page roots with a dedicated desktop-only class/data attribute.
   - Scope the experiment to public pages so dashboard, admin, authentication workflows, dialogs, and other product UI are not globally distorted.

2. **Remove the alternate mobile header path from public rendering**
   - Stop rendering the hamburger/sheet navigation in the public header.
   - Always render the full left and right desktop navigation groups.
   - Use the full reservation label and all navigation links at every width.
   - Give the header a desktop minimum width rather than silently collapsing it.

3. **Collapse public CSS to one desktop contract**
   - Remove the phone and compact public-layout media-query behavior.
   - Apply the current full-desktop typography, spacing, hero, prompt, header, and container values unconditionally.
   - Preserve the hero as full bleed.
   - Give the body layout a desktop canvas/minimum width so a narrow effective CSS viewport scrolls horizontally instead of reflowing into a phone layout. This makes the experiment unambiguous: it may crop/scroll on a phone, but it cannot become mobile UI.

4. **Neutralize page-level responsive reflow on public routes**
   - Add desktop-only overrides for public grids, flex directions, section spacing, cards, buttons, and widths that currently depend on `sm:`, `md:`, or `lg:` utilities.
   - Ensure two/three-column desktop sections stay in their desktop configuration even when the browser reports fewer CSS pixels.
   - Do not change copy, colors, assets, functionality, or authenticated pages.

5. **Make the deployed result self-identifying**
   - Extend layout diagnostics to report `desktop-forced`, release ID, CSS bundle, viewport metrics, desktop nav state, and absence of the mobile nav.
   - Keep this behind the existing `?layout-diagnostics=1` switch so the published page can prove which bundle and layout contract it is running.

6. **Verify the experiment before publishing**
   - Test key public routes at effective widths of `390`, `640`, `768`, `900`, `1024`, `1386`, and `1400` CSS pixels.
   - Assert the desktop nav remains visible, no hamburger exists, desktop typography remains fixed, and representative grids do not collapse.
   - At narrow widths, assert horizontal overflow exists by design rather than responsive mobile reflow.
   - Capture screenshots at `390`, `900`, and `1386` to visually confirm the exact same desktop composition is being used.
   - Publish only after those assertions pass, then validate the published URL with diagnostics enabled and compare its computed navigation/layout state against the local build.

## Expected trade-off
This test intentionally refuses mobile presentation. Actual phones and narrow browser windows will see a desktop-width canvas that may require horizontal scrolling. If the published site still resembles the attached broken UI after this change, responsive CSS is no longer a plausible cause; the diagnostics will then isolate stale deployment, browser zoom/scaling, or a different served bundle.