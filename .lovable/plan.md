# Hero Delivery Recovery Plan

## Confirmed diagnosis

**Do I know what the issue is? Yes.**

The attached 4:42 PM screenshot is still rendering the rejected enlarged hero geometry: roughly a 69px header, 42px logo, 56px headline, and 1,090px prompt. The current fresh production response at the same desktop viewport renders a 52px header, 32px logo, 42px headline, and 800×152px prompt.

The screenshot is therefore not being produced by the CSS bundle currently served to a fresh browser. The unresolved failure is **stale-build delivery in the already-open preview/browser session**, not another unidentified sizing rule. The app currently waits 30 seconds before checking for a new build and only offers a manual refresh; that allows the obsolete enlarged bundle to remain visibly active after a rebuild.

## 1. Make stale builds self-correcting

- Change the build-version check to run immediately on startup and whenever the tab regains focus.
- When the HTML build marker differs from the running JavaScript marker, perform one automatic cache-busted navigation to the same route.
- Add a session guard so a failed deployment cannot cause a reload loop.
- Preserve route, query parameters, and hash during the refresh.
- Keep a manual recovery message only if the automatic reload still returns the old build.

## 2. Fix delivery caching at the host boundary

- Add explicit hosting headers so `index.html` is always revalidated and cannot pin an old asset manifest.
- Keep fingerprinted `/assets/*` files long-lived and immutable.
- Confirm there is no service worker and no alternate homepage shell serving an old bundle.
- Verify the landing-only gate and normal `/` route both resolve to the same current hero implementation when applicable.

## 3. Strengthen the regression gate

Extend `scripts/hero-geometry.py` so a pass requires more than dimensions:

- Test fresh and already-open browser sessions.
- Test the real preview and custom domain at 1576×1043 with DPR 1 and DPR 1.8.
- Record the HTML build marker plus loaded CSS/JS asset hashes.
- Fail if the running build marker and current HTML marker differ.
- Assert the fixed geometry: 52px header, 32px logo, 42px title, 800×152px prompt, 18px input, and 13px CTA.
- Capture screenshots and compare the actual visible composition, not only DOM measurements.

## 4. Verify the exact failure path

- Open the current site in one browser context and keep it open.
- Deploy a deliberately identifiable build marker without changing the hero design.
- Return focus to the old tab and prove it automatically replaces itself with the new build.
- Confirm the loaded asset hashes then match a fresh browser context.
- Confirm the enlarged 1,090px prompt cannot persist after the replacement.

## 5. Production acceptance gate

The work is not complete until all of these are true on `startuplabs.online`:

1. A fresh browser shows the compact hero.
2. An already-open stale tab self-updates to the same build.
3. Production and local screenshots match at 1576×1043.
4. Production and local element boxes match within 1px.
5. The prompt submission/modal flow still works.
6. The tested build marker and asset hashes are recorded with the screenshots.

No further visual resizing will be attempted unless the fresh, hash-matched production screenshot itself fails the target; this plan addresses the confirmed stale-build path rather than guessing at CSS again.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>