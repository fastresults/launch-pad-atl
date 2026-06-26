## Fix: route "See all 34 deliverables we build together" to the Founders Hub

**Problem**
In `src/routes/_authenticated/dashboard/day.tsx` (line 211), the CTA links to `/dashboard/workflow`, which is the generic workflow status page — not the Founders Hub workflow the user expects.

**Change**
- Update the `<Link to="...">` on line 211 from `/dashboard/workflow` to `/dashboard/hub` (Founders Hub entry point that lists ventures and drives the deliverable workflow).
- Leave the secondary "Browse your ventures" CTA logic intact; since both would now point at the hub, remove the duplicate `hasVentures` button to avoid two identical CTAs.

No other files affected.