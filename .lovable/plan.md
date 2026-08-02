# Bulletproof Hero Recovery Plan

## Confirmed diagnosis

**Do I know what the issue is? Yes.**

The attached broken screenshot is rendering the **older enlarged geometry**: approximately an 1,100px prompt, oversized headline/input/CTA, and an enlarged wordmark. The current source and current live-domain DOM now compute to a smaller 800×152px prompt, 42px headline, 18px input, 13px CTA, 32px logo, and 52px header. This proves the recurring failure is not one remaining `zoom` property; it is a combination of:

- repeated geometry rewrites without a single immutable visual contract;
- old and new deployments/assets being judged as though they were the same build;
- previous validation relying on claimed dimensions instead of proving which deployed asset produced the screenshot;
- global breakpoint customization (`lg` changed from Tailwind’s normal 1024px to 960px) affecting header utilities beyond the hero;
- background `object-fit: cover` plus a 1.06→1.14 scale animation making the photography itself appear additionally zoomed;
- no automated failure gate preventing an enlarged hero from being published again.

The attached image is the **rejected baseline**, not a design reference to reproduce.

## 1. Freeze a measurable desktop contract

Create one explicit desktop contract for the first viewport. At every width from 960px upward, components remain the same size; wider screens receive only more whitespace.

- Header: 52px high
- Logo: 165×32px maximum
- Navigation: 13px, one line, fixed compact gaps
- Hero title: 42px maximum, 598px maximum rendered width
- Hero stack: 800px maximum width
- Prompt: exactly 800×152px on standard desktop
- Input: 18px
- CTA: approximately 150×42px, 13px label
- Kicker/status: 11px
- No page, root, parent, or component `zoom` or scale transform
- Hero stack centered as one unit, with a bounded slight upward offset—not viewport-percentage drift
- Desktop scene starts near `scale(1.01)` and ends no higher than `scale(1.05)` so Ken Burns motion does not read as page magnification

For 960–999px, use one compact-desktop contract rather than a mobile or enlarged intermediate tier. Mobile remains separate below 960px.

## 2. Remove hidden sources of scale drift

Restrict work to the first viewport files:

- `src/components/home/CinematicHero.tsx`
- `src/components/home/IdeaPrompt.tsx`
- `src/components/site/Header.tsx`
- the isolated `sl-*` section in `src/styles.css`

Changes:

- Remove the global custom `--breakpoint-lg: 60rem` override and use an explicit hero/header media query or named breakpoint, so normal `lg:` behavior elsewhere is untouched.
- Remove Tailwind responsive sizing classes from inside the desktop header and hero where CSS already owns geometry.
- Keep exactly one geometry owner: the contiguous `sl-*` CSS block.
- Remove obsolete `.hero-*` rules that can still affect hero-adjacent behavior or create misleading maintenance paths.
- Replace `translateY(-5vh)` with a stable layout track and bounded pixel/rem offset.
- Reduce scene transform scaling and define `object-position` per scene where necessary instead of enlarging the entire image.
- Preserve scene rotation, typing, modal launch, and reduced-motion behavior unchanged.

## 3. Add a deployed-build identity check

Before comparing visuals, prove that preview and production are running the same build.

- Read the app-version marker and loaded hashed CSS/JS asset URLs from both local preview and `startuplabs.online`.
- Record them with every validation run.
- Reject a comparison when build IDs or asset hashes differ.
- Use a cache-busted production navigation and a fresh browser context.
- Confirm there is no service worker, stale route shell, landing-only alternate component, or cached HTML serving the old 1,100px prompt.
- Do not publish a second time merely because the first deployment is still propagating.

## 4. Build an automated geometry gate

Add one Playwright regression check for 1000×800, 1280×720, 1576×1043, and 1920×1080.

At every desktop viewport it will assert:

- correct component exists exactly once;
- header height = 52px;
- logo height = 32px;
- title font size = 42px;
- prompt width = 800px and height = 152px, allowing only a 1px rendering tolerance;
- input = 18px and CTA = 13px;
- no computed `zoom` other than `1`;
- no scale transform on the header, stack, prompt, title, input, or CTA;
- prompt and title remain horizontally centered;
- stack stays inside the viewport with minimum top/bottom whitespace;
- mobile navigation is absent and full navigation is visible at desktop widths;
- active scene scale stays within the new Ken Burns limit.

Any failed assertion blocks publishing.

## 5. Validate visually against the rejected screenshot

Generate same-size screenshots for all four desktop viewports and a measurement overlay showing element boxes and values.

Acceptance requires:

- the prompt is visibly much narrower than the rejected 1,100px panel;
- the logo, headline, input, CTA, and navigation no longer read as enlarged;
- the background subject is not excessively cropped or zoomed;
- whitespace increases from 1280→1576→1920 while component dimensions remain constant;
- the entire first viewport reads as a desktop composition, not a blown-up mobile composition.

## 6. Publish once, then verify production—not preview

- Publish only after the local geometry gate passes at every viewport.
- Wait for the custom-domain asset hash to match the new build.
- Run the exact same geometry assertions directly against `startuplabs.online`.
- Capture the production screenshot at 1576×1043.
- Compare production and local bounding boxes; all contracted dimensions must match within 1px.
- If hashes differ, stop and diagnose deployment propagation. If hashes match but geometry differs, stop and inspect computed CSS order. Do not apply another visual patch.

## Definition of done

The work is complete only when the custom domain—not merely local preview—passes the asset-identity check, all geometry assertions, the interaction smoke test, and the 1576×1043 screenshot review. No success claim will be made from source inspection or local screenshots alone.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>