## Goal

Two copy-only updates across the public site:

1. Make clear that **coffee + light refreshments are provided** at the workshop.
2. Sharpen the messaging so the **strategic foundation** reads as the headline attraction — not a side benefit.

No layout, route, or schema changes. No new components.

---

## Changes

### 1. `src/lib/schedule-data.ts`
- Update the check-in session (currently "Coffee, intros, set up your laptop…") to explicitly say coffee and light refreshments are provided throughout the morning.
- Remove the stale "Catered lunch & discussion" block — the workshop now ends at 11:30 AM, so a lunch break no longer fits. Replace with a short mid-morning refreshment break.

### 2. `src/components/home/HomeFramework.tsx`
- **Hero (lines 51–64):** lead with "The Strategic Foundation" as the named product. Tighten the H1 around foundation language; reframe the sub-copy so the six artifacts are the headline value, not the half-day format.
- **Meta strip (line 84):** swap "Half-day · 4 hours" for "8:45–11:30 AM · Coffee & refreshments included" (or add a 5th meta tile for refreshments — pick one in implementation to avoid crowding).
- **Framework section (lines 108–113):** rename heading from "Six strategic deliverables" to "Your strategic foundation" and reframe the six items as the components of that foundation. Keep the "$5,000+ consultant" anchor — it's doing real work.
- **In-scope list (line 137):** lead the included bullets with "The complete strategic foundation" instead of the current generic first line.

### 3. `src/components/register/RegisterFramework.tsx`
- **Hero badge + H1 area (lines 86–94):** rename to "Strategic Foundation Workshop" and rewrite the sub-copy so the foundation is the promise (positioning, ICP, pricing, economics, 90-day roadmap, build/hire/buy) — not "a framework you can run."
- **Price card aside (lines 209–217):** under the price, add a one-line "Coffee and light refreshments provided" note alongside the existing "small cohort, working session with Adam" line.

### 4. `src/lib/framework-deliverables.ts`
- Optional: rename the exported concept from "Framework" to "Foundation" in user-facing strings only. Keep variable names (`FRAMEWORK_DELIVERABLES`, `WORKSHOP_PRICE_LABEL`) unchanged to avoid a sweep across imports.

---

## Out of scope

- No changes to `/services`, header, footer, admin, or DB.
- No new images or icons.
- Pricing, time (8:45–11:30 AM), and cohort logic stay as-is.

---

## Technical notes

- All edits are string/JSX swaps inside existing components — no new files, no new exports, no type changes.
- The `SCHEDULE` array currently still describes a full-day agenda (8:00 AM – 4:30 PM with lunch). It's not rendered on the new home/register pages, but it's worth trimming to match the half-day reality so any future schedule view doesn't show stale content.
