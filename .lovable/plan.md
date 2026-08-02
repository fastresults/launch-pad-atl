# Published-Site Parity Recovery

## Confirmed diagnosis

This is not another hero-layout problem.

- The Lovable designer is running app version `2026-08-02T21:06:10.242Z`.
- `startuplabs.online` is still serving the older app version `2026-08-02T20:52:34.508Z` and the older bundled stylesheet `index-CAuk4Nw-.css`.
- At the same controlled 1576×1043 viewport, the currently published build still renders the old fixed 800px prompt, while the designer contains the newer proportional implementation.
- The production page itself reports normal root geometry (`16px` root font, `zoom: 1`, no root transform, `visualViewport.scale: 1`). Therefore another CSS size adjustment would repeat the previous mistake.

## Implementation

1. **Freeze the designer state**
   - Make no further visual or copy changes.
   - Treat the currently approved Lovable designer rendering as the source of truth.

2. **Strengthen the deployment identity check**
   - Extend the existing version marker so the deployed HTML exposes both the app version and current CSS bundle identity.
   - Update the parity gate to fail when preview and production do not serve the same release, before comparing any geometry.

3. **Test representative public pages**
   - Compare `/`, `/workshops`, `/services`, and one additional public offer page in preview and production.
   - At identical desktop and tablet viewports, record root font size, viewport width, header bounds, H1 bounds, primary content width, loaded CSS asset, and app version.
   - Add screenshot comparison evidence for each route so a site-wide scaling difference cannot be mistaken for a hero-only issue.

4. **Publish the exact verified build**
   - Run the security/build gates, then publish without making changes after verification.
   - Confirm the custom domain serves the same app version and CSS bundle as the designer.

5. **Production acceptance gate**
   - Do not call the issue fixed until `startuplabs.online` passes release-identity and layout-parity checks on all selected public routes.
   - If the same release measures identically in an isolated browser but the user’s existing browser still appears enlarged, verify the browser’s saved per-domain zoom separately with a 100% reset (`Cmd/Ctrl+0`); do not compensate for browser zoom by distorting the site CSS.

## Acceptance criteria

- Designer and custom domain report the same app version and production bundle.
- Homepage geometry matches the designer at desktop and tablet widths.
- Public-page headings, navigation, containers, and spacing match their designer equivalents.
- No production-only `zoom`, root transform, font-size override, or alternate stylesheet is present.
- Screenshots from the custom domain—not localhost—are the final proof.