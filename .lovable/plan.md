# Unify Studio headers with the framework section-card style

Goal: make the **Brand Wizard & bonus tools** wrapper and its three children (**Brand Studio**, **Social Studio**, **Content Studio**) render with the exact same header treatment used by the numbered framework sections (Strategy / Operations / Finance / Marketing / Governance / Brand / Social & Content in screenshot 4).

That header style, produced by `src/components/hub/SectionHeader.tsx`, has:
- A colored **accent left bar** and subtle horizontal gradient tinted by the accent
- A **round two-digit index chip** (e.g. `09`) in the accent color
- Section **icon**, **title**, small **count** (`n/n`), and **tagline** underneath
- A **thin progress bar** (accent-filled), a rounded **status pill** (Complete / In progress / …)
- Right-aligned **action buttons** (outline style, `size="sm"`)

Only the four surfaces above are being restyled. No logic changes.

## Scope of changes (presentation only)

### 1. Generalize `SectionHeader` so studios can reuse it
`SectionHeader` currently derives its icon, label, tagline and accent from `getStageMeta(cat)`. Extend the props with optional overrides so studios can plug in without adding fake stage-meta rows:

```text
+ icon?: LucideIcon
+ label?: string
+ tagline?: string
+ accentVar?: string   // e.g. "--stage-brand", "--status-info"
+ badges?: ReactNode   // extra pills next to title (Locked, Brand-gated, Required for Website PRD)
```

When present, these override the `getStageMeta(cat)` values. All existing call-sites keep working unchanged.

### 2. `hub.$snapshotId.tsx` — "Brand Wizard & bonus tools" wrapper (lines ~1515–1543)
Replace the `<details><summary>…</summary></details>` block with the same `Collapsible` + `SectionHeader` pattern used above for framework categories:

- `index` = next number after the last framework section (e.g. `08` if Social & Content was 08 → this becomes `09`)
- `icon` = `Wand2` (or `Sparkles`)
- `label` = "Brand Wizard & bonus tools"
- `tagline` = existing copy ("Lock your brand colors, typography and logo here — the Website PRD generation uses them verbatim.")
- `done/total` = number of the three studios that are "ready" (Brand locked, Social kit generated, Content calendar generated) out of 3
- `status` = `complete` when all 3 ready, `in_progress` when any progress, `not_started` otherwise
- `badges` = existing "Required for Website PRD" pill when brand kit unlocked
- `actions` = none (children have their own)
- Keep the existing default-open logic

### 3. `BrandStudio.tsx` (header at lines 41–64)
Replace the current flat header with `SectionHeader`:
- `icon` = `Palette`, `accentVar` = `--stage-brand` (matches the framework Brand row's purple)
- `label` = "Brand Studio", `tagline` = "Lock palette, typography & logo — powers Website PRD"
- `done/total` = `kit.step ?? 0` / `5`
- `status` = `complete` when `locked`, `in_progress` when `kit && !locked`, `not_started` otherwise
- `badges` = existing `Locked` / `Step n / 5` pill
- `actions` = existing `Reset` + `Start / Resume / Edit brand` buttons (outline `size="sm"`)
- Body (palette swatches, typography, logos, wizard mount) is unchanged, just moved under the new header inside the same card

### 4. `SocialStudio.tsx` (header at lines 49–70)
- `icon` = `Share2`, `accentVar` = `--stage-social` (matches Social & Content purple)
- `label` = "Social Studio", `tagline` = "Channel kits, strategy & covers from your brand"
- `done/total` = wizard step / 6 (Goals → Build plan → Channels → Style → Build kit → Launch)
- `status` derived from `locked` + progress
- `badges` = existing "Brand-gated" / step chip
- `actions` = existing "Advanced mode" toggle as an outline `size="sm"` button
- Tabs and body unchanged

### 5. `ContentStudio.tsx` (three headers at lines 152–196)
Replace all three variants (loading, brand-gated gate, calendar-missing gate, main step header) with `SectionHeader`:
- `icon` = `Newspaper`, `accentVar` = `--stage-social` (or a dedicated content accent if defined)
- `label` = "Content Studio", `tagline` = "Turn planned posts into on-brand ads"
- `done/total` = `step` / `5`
- Right-side meta ("13 ads generated · 9 planned posts") rendered as a small `text-xs text-muted-foreground` line inside `actions`
- Gated variants use `status = "locked"` with the existing explanatory paragraph kept below the header

## Files touched
- `src/components/hub/SectionHeader.tsx` — add optional `icon` / `label` / `tagline` / `accentVar` / `badges` props (backward compatible)
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — swap the `<details>` wrapper for `Collapsible` + `SectionHeader`
- `src/components/hub/BrandStudio.tsx` — replace header
- `src/components/hub/SocialStudio.tsx` — replace header
- `src/components/hub/ContentStudio.tsx` — replace all four header variants

## Non-goals
- No changes to studio logic, wizard flows, generation, gating rules, or data.
- No changes to the framework section cards themselves — they already define the target style.
- No new colors added to `index.css` unless a studio has no existing accent token; in that case reuse `--stage-brand` / `--stage-social` / `--status-info`.

## Verification
After edits: reload `/dashboard/hub/:id`, scroll to the Bonus tools block. All four headers should visually match the Strategy/Operations/Finance rows — same left bar, index chip, icon, title, progress bar, status pill, and right-aligned outline buttons — in both light and dark themes.
