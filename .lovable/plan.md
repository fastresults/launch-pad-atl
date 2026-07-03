## Goal
Temporarily prevent users from creating additional ventures beyond their first. When they click **New startup** and already have one or more existing ventures, show a modal explaining that multi-venture support is coming soon and will be a paid add-on for serial entrepreneurs and consultants.

## Behavior
- If the user has **0 ventures** → button still routes to `/dashboard/hub/new` (unchanged).
- If the user has **≥1 venture** → clicking either "New startup" button (top-right header + empty-state) opens an `AlertDialog` instead of navigating.

## Modal content
- Title: **Multiple startups coming soon**
- Body: Short message that additional ventures are a planned feature for serial entrepreneurs, founders, and startup consultants. Will be available as a paid upgrade. Invite them to keep building on their current venture in the meantime.
- Optional secondary CTA: "Notify me" (just closes with a toast "We'll let you know" — no backend wiring, purely UI acknowledgement) — or skip and use a single **Got it** action. I'll go with **Got it** + a subtle "Have questions? Contact support" line to keep scope tight.

## Implementation (single file)
Edit `src/routes/_authenticated/dashboard/hub.index.tsx`:
1. In `LibraryInner`, add `const [showComingSoon, setShowComingSoon] = useState(false)` and derive `hasVentures = snapshots.length > 0`.
2. Replace the header `<Button asChild><Link to="/dashboard/hub/new">…</Link></Button>` with a conditional: when `hasVentures`, render a plain `<Button onClick={() => setShowComingSoon(true)}>`; otherwise keep the Link version.
3. Do the same swap in `EmptyState` — but since `EmptyState` only renders when the current tab is empty, and the "active" empty state implies no ventures, the Link is fine there. No change needed.
4. Add an `<AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>` at the bottom of `LibraryInner` with the copy above and a single **Got it** action.

No routing, DB, or business-logic changes. Frontend-only.
