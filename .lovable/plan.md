# Mobile-First Rebuild — Forensic Plan

Goal: when viewed on a phone (≤ 767px), every page feels designed for that device first — not a shrunken desktop. Desktop layout stays exactly as it is today.

---

## 1. The header (highest-priority issue)

**Current state in `src/components/site/Header.tsx`:**
- Nav links (`home`, `schedule`, `register`, `admin`) are hidden below `md` — so on mobile there is **no navigation at all**.
- The right side still renders the full "Reserve seat — from $679" pill **plus** the sign-in/sign-out link, side-by-side with the logo. On a 375px screen this overflows or wraps awkwardly.
- No hamburger, no mobile drawer.

**Rebuild:**
- Three-column mobile layout: logo (left, slightly smaller `h-9`), compact pill on the right showing just "Reserve" (no price), and a hamburger button.
- Hamburger opens a `Sheet` (right side, already in the project) containing: full nav links stacked, the price line ("Reserve seat — from $679") as the primary CTA inside the drawer, sign-in/out, and admin link when applicable. Close on link tap.
- Sticky header height drops from `py-2` (with `h-10/h-12` logo) to a tighter mobile bar; backdrop blur stays.
- Desktop (`md+`) renders exactly the current layout — no visual change.

---

## 2. Home page (`src/routes/index.tsx`)

**Hero**
- `text-5xl` headline at 375px is ~48px and breaks the line awkwardly after "in with an". Drop mobile to `text-4xl` with `leading-[1.1]`, scale up to `text-7xl` from `md` onward.
- Reduce `py-24` to `py-16` on mobile so the hero fits closer to one viewport.
- CTA row: stack the two buttons full-width on mobile (`flex-col w-full`), keep inline from `sm` up. The "Claim one of 10 seats" pill becomes the primary, full-width tap target.
- Meta chips grid: switch from 1 col → 2 col → 4 col to a single column stack with tighter padding on mobile so chips don't truncate.

**NotACourseBanner**
- The three `BannerChip`s currently `flex-wrap` on mobile and overflow the right edge with long labels ("Built in the room, not assigned as homework"). Stack chips vertically full-width on mobile, keep the row layout on desktop.
- Heading drops from `text-xl` to `text-lg` on mobile; body text from `text-sm` to `text-[13px]` with looser leading.

**TheArtOfThePossible, WalkInWalkOut, FlowStrip, FacilitatorProof** (and any other grid sections)
- Audit every `grid` and `md:grid-cols-*`: confirm a clean single-column mobile state with consistent vertical rhythm (`gap-4` mobile, `gap-6` desktop).
- Reduce all section `py-20` → `py-12` on mobile.
- Section headings: cap mobile at `text-3xl` (`leading-tight`), let `md:text-4xl`/`5xl` take over from tablet.

**FacilitatorSection**
- Card padding `p-8` is too tight on mobile when the gradient portrait sits above text. Switch to `p-6` mobile and reduce internal gaps; ensure the portrait aspect doesn't push the page past viewport width.

**VenueCard / BottomCTA**
- Stack CTAs full-width on mobile; ensure address/maps link wraps cleanly.

---

## 3. Schedule page (`src/routes/schedule.tsx`)

- Hero `text-5xl` → `text-4xl` mobile.
- "Day at a glance" rail already horizontally scrolls — good. Add `snap-mandatory` for better thumb scrolling and a fade-edge gradient on the right.
- Timeline cards: reduce `p-6` → `p-5` mobile; the `flex-wrap` time + stage badge row should stack on the smallest screens.
- Stage "essential tasks" inner card (`p-5`) overflows when task titles are long — drop padding and tighten the numbered bullets.
- Footer CTA tile padding `p-8` → `p-6` mobile, button full-width.

---

## 4. Register page (`src/routes/register.tsx`)

- Hero headline mobile cap at `text-4xl`.
- The three-icon meta row (`Users`, `CalendarDays`, `ShieldCheck`) should stack or wrap cleanly — currently relies on `flex-wrap` with `gap-4` and looks loose on mobile.
- **PricingTiers cards (`src/components/value/PricingTiers.tsx`)**: `p-6 md:p-7` is fine but the price `text-5xl` is huge on mobile and pushes layouts; drop to `text-4xl` mobile. Ensure each card's CTA button is full-width on mobile (already is via `inline-flex … px-5`).
- **TotalsBar (`src/components/value/TotalsBar.tsx`)**: `md:grid-cols-3` → already stacks, but inner `text-3xl` values should drop to `text-2xl` mobile and the accent tile should match height/padding of siblings.
- **CohortPicker (`src/components/value/CohortPicker.tsx`)**: featured row already wraps; the pill rail already scrolls. Add snap and tighten pill min-width on small screens.
- **ValueGrid mobile cards**: already has a dedicated `md:hidden` mobile renderer — verify spacing and tap targets, no structural change needed.
- Form section: keep current single-column layout, but make the submit button full-width (already), ensure inputs have `min-h-12` for touch.

---

## 5. Auth / dashboard / admin routes

- `src/routes/_authenticated/dashboard.tsx` header nav (`Overview`, `Profile`, `Documents`, …) is a horizontal `flex` with no mobile treatment — it overflows. Convert to a horizontally scrollable tab rail on mobile, keep inline on desktop. Email + sign-out collapses behind an avatar/menu on mobile.
- Admin tables / dashboards: out of scope for this pass unless a specific page is broken — log issues, don't refactor.

---

## 6. Footer (`src/components/site/Footer.tsx`)

- Already stacks on mobile via `flex-col`. Center-align all three blocks on mobile (currently `items-start`) and reduce vertical gap.

---

## 7. Global / cross-cutting

- Add a viewport-safe `overflow-x-hidden` guard on `<body>` to catch any stray horizontal scroll while we refactor.
- Audit every section that uses `max-w-6xl px-6` — confirm `px-5` on mobile (or keep `px-6` if it reads better) and that nothing relies on horizontal margins that disappear.
- Confirm all interactive elements meet a 44px minimum tap height on mobile.
- Make sure `useIsMobile()` (already exists at `src/hooks/use-mobile.tsx`) is used only when CSS can't express the difference — prefer Tailwind responsive prefixes.

---

## Out of scope

- Any color, typography, or brand changes.
- Desktop layout — must remain pixel-identical.
- Admin tables, attendee detail pages, deliverables editor (separate pass if needed).
- Copy edits beyond shortening labels that overflow on mobile.

---

## Verification

After implementation:
1. Browser at 375×812, 390×844, 414×896, and 768×1024 — screenshot every public page (home, schedule, register, login, signup) and the dashboard header.
2. Confirm: no horizontal scroll, no overlapping elements, header nav reachable, all CTAs tappable, hero readable above the fold.
3. Re-verify desktop 1366 and 1920 are unchanged.

## Technical notes

- Use `Sheet` from `src/components/ui/sheet.tsx` for the mobile nav drawer (already available).
- Use Tailwind's `md:` breakpoint (768px) as the mobile/desktop cutoff to match `useIsMobile`.
- Keep all changes inside frontend/presentation files — no data, no server function, no schema changes.
