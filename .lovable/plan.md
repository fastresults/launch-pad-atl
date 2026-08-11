# Platform Build Add-On

The foundation and the 120-day runway cover the business: entity, money, brand, site, sales machine. What they don't cover is a **software platform** — a marketplace, a matching site, a booking or membership product, anything that needs real development. Right now a founder who needs one finds that out late. This adds it to the decision as a clearly-scoped, clearly-priced add-on.

## How to word it

Name: **Platform Build — add-on**. Never "custom development" (sounds open-ended) and never "app" (too small).

Headline line: **"Your startup needs software, not just a site."**

Body: "Marketplaces, matching platforms, booking and membership products, operator dashboards — anything where the product *is* the software. That's a build, not a page, so it sits outside the 120-day runway. Platform builds start at **$3,750**, scoped and quoted after a short build call."

Guardrails in the copy so nothing is over-committed:
- "starts at $3,750" — always *starts at*, never a flat price.
- "scoped and quoted on a build call" — the number opens the conversation, it doesn't close it.
- List the *types* we build (marketplace, matching, booking, membership, portal), not features or timelines.
- No delivery dates, no hours, no tech stack promises in client-facing copy.

## Where it appears in the workflow

**1. Inside the comparison gate** (`InvestmentCompare`), as a third, quieter band beneath the two cards — not a third choice. It reads as: "Both of these get your business running. If the business *is* a platform, add this." A single **"Talk to us about a platform build"** button.

**2. On the retained card**, one line in the covered list: "Platform builds (marketplace, matching, booking) quoted separately — from $3,750."

**3. In the self-build path**, the same band appears with a sharper edge: the runway assumes an off-the-shelf site; a platform is the one thing that can't be self-served from this list.

**4. After a mode is chosen**, the band persists as a slim strip in the Operationalize header area so it stays reachable without re-opening the gate — dismissible, and hidden once a request has been sent (replaced by "Platform build requested — we'll reach out").

**5. The request itself** opens a short dialog: what the platform does (free text), who it's for, whether they have a deadline, contact. Submitting posts a request the agency sees, and shows the founder a confirmation with what happens next (build call, scope, fixed quote).

## Technical details

- `src/lib/ops-platform.ts` — constants (`PLATFORM_FROM_CENTS = 375_000`), the platform-type list, and the copy strings, so pricing is tuned in one place.
- `src/components/ops/PlatformAddOn.tsx` — the band (used in the gate) plus a compact `variant="strip"` for the post-decision header.
- `src/components/ops/PlatformRequestDialog.tsx` — the intake form and confirmation state.
- `InvestmentCompare.tsx` — render the band below the two cards and add the one-line mention to the retained card's covered list.
- `OpsDashboard.tsx` — render the strip when no platform request exists and the user can edit; static "requested" badge otherwise.
- Backend: new `venture_ops_platform_requests` row set (snapshot_id, description, audience, deadline, contact, status, created_at) with GRANTs + RLS, and two `venture-ops` actions — `request_platform_build` (share-token or authenticated caller) and `set_platform_request_status` (agency only). The existing `post_update` feed gets an entry so the request shows in the delivery activity trail; the agency is emailed via the same transactional path `share-consult-request` already uses.
- Platform pricing stays out of `ops-investment.ts` — it must never fold into the self-vs-retained math, since it's a separate scope on both sides.

## Build order

1. Constants + copy file.
2. Add-on band and request dialog (UI only, wired to a stub).
3. Table + `venture-ops` actions + email notify.
4. Post-decision strip and requested-state handling.
5. Agency-side visibility in the delivery console.
