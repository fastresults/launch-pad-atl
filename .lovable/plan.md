# Public layout root-cause recovery

## Root cause identified

The deployed site is **not being converted into a separate mobile build**.

The evidence is conclusive:

- Current source, fresh production output, `startuplabs.online`, and the Lovable published URL use the same release fingerprint and byte-identical CSS/JS assets.
- The standard viewport meta is present in the published HTML.
- The hosting-injected analytics script does not alter styles, viewport geometry, or media queries.
- At controlled CSS widths, local and public render the same navigation state: hamburger through `1023px`, full navigation at `1024px`.
- `SiteHeader` always renders both versions. `src/public.css` hides desktop navigation by default and shows mobile controls by default; the full navigation is enabled only by `@media (min-width: 1024px)`.
- Typography switches earlier at `768px`, creating an unintended `768–1023px` hybrid: desktop-sized UI with mobile navigation. This is the exact combination in the screenshot.
- The Lovable designer’s desktop canvas is emulated and scaled inside the editor. The published tab uses its real CSS viewport. Browser zoom is also stored per origin, so the editor and custom domain can expose different effective widths on the same monitor.
- On a 1400px display, roughly 140% site zoom—or an equivalently narrowed browser viewport—drops the public page below the `1024 CSS px` threshold and triggers the mobile controls while enlarging every CSS pixel.
- Public routes still contain many Tailwind `md:` and `lg:` font-size, spacing, and sizing utilities. Therefore `public.css` is not actually the sole public layout source, and those utilities create inconsistent scaling between sections and pages.

## Implementation plan

### 1. Replace mobile-first fallback with explicit public layout modes

- Make full navigation the safe base state instead of hiding it by default.
- Put the hamburger/Reserve controls inside an explicit phone-only media query.
- Use one phone breakpoint for the entire public shell so a partially applied or missed media rule cannot default a desktop page to mobile.
- Preserve the current full-bleed hero and desktop edge-aligned header.

### 2. Remove the 768–1023 hybrid tier

- Align navigation, typography, spacing, and layout changes to a coherent breakpoint contract.
- Treat tablet and desktop as the full public-site layout, with a compact full-navigation variant where horizontal room is tighter.
- Keep the hamburger only for genuine phone widths.
- Reduce header gaps and optional labels in the compact tier rather than switching the whole site to mobile.

### 3. Establish one authoritative public type and spacing system

- Inventory public-facing routes and components for `md:`/`lg:` typography and oversized spacing utilities.
- Replace conflicting responsive display sizes with semantic public classes/tokens governed by `public.css`.
- Keep grid/layout utilities where they are genuinely structural, but remove route-specific rules that compete with the global public type scale.
- Ensure headings, buttons, cards, and section spacing do not jump independently at different breakpoints.

### 4. Add evidence-only runtime diagnostics

- Add a query-flagged diagnostic mode that records, without changing visible layout:
  - `innerWidth`
  - `visualViewport.width` and scale
  - `devicePixelRatio`
  - `screen.width`
  - active phone/tablet/desktop mode
  - browser zoom estimate where detectable
  - computed visibility of desktop and mobile header controls
  - release ID and CSS bundle name
- This will expose the affected browser’s actual runtime measurements rather than inferring them from monitor resolution.

### 5. Restore production parity testing

- Restore the missing public parity test referenced by `package.json`.
- Test local production output and the published origin at `390`, `640`, `767`, `768`, `900`, `1023`, `1024`, `1280`, `1400`, and `1920` CSS pixels.
- Assert:
  - phone widths show phone controls;
  - tablet and desktop widths show full navigation;
  - desktop-sized typography never appears with a hamburger;
  - hero remains full bleed;
  - non-hero content remains centered and constrained;
  - release and asset fingerprints match before geometry is compared.

### 6. Verify the actual deployment path

- Validate the production bundle before publishing.
- Publish the frontend update through Lovable’s Publish → Update flow; frontend changes do not become public automatically.
- Re-run the same measurements against both the Lovable URL and custom domain after publication.
- Use the diagnostic flag once in the affected browser to confirm its real viewport mode, then remove or disable the temporary diagnostics.

## Acceptance criteria

- The screenshot’s desktop-sized content plus hamburger combination is impossible.
- Tablet and desktop use full navigation even when the browser exposes fewer than 1024 CSS pixels.
- Mobile controls appear only in the explicit phone layout.
- All public pages use one predictable standard type/spacing scale without global `zoom`, layout transforms, viewport-based font sizing, or competing responsive display classes.
- Local production output, Lovable published URL, and custom domain produce the same computed layout at the same CSS viewport width.
- The affected public browser reports its viewport and active mode directly, making any remaining environment difference observable rather than speculative.