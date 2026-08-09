# Upload & replace the logo set — everywhere the mark is shown

Today a founder can only upload their own logo in one buried spot inside the Brand Wizard's logo step, and it accepts a single file that becomes "the mark". The Brand Studio identity board (Your mark / on light / on dark / on brand) is read-only, and the top of the Brand Wizard modal shows no mark at all.

This makes the mark uploadable and replaceable as a **set**, from one shared component used in both places.

## What a "logo set" means

Four slots, each independently uploadable and replaceable:

| Slot | Used for |
| --- | --- |
| Primary | Default mark on light backgrounds |
| Reversed | Mark on dark backgrounds (falls back to primary) |
| Icon / monogram | Favicons, avatars, social profile, small collateral |
| Wordmark (optional) | Header lockups, letterhead |

If only Primary is uploaded, everything else falls back to it — exactly the behaviour today, so nothing regresses for existing ventures.

## One shared component

Build `LogoSetPanel` in `src/components/hub/brand/`:

- Renders the same three preview tiles that exist now (on light with transparency checkerboard, on dark, on brand).
- Below them, a compact row of the four slots. Each slot is a small drop target: drag a file on it, or click to pick. Filled slots show a thumbnail with **Replace** and **Remove** on hover.
- A single **Upload logo set** button that accepts multiple files at once and assigns them to slots by filename hints (`-dark`, `-reversed`, `-icon`, `-mark`, `-wordmark`), with the assignment shown so the founder can correct it.
- Accepts SVG, PNG, JPG, WebP. SVG preferred — the panel says so and flags a low-resolution raster upload.
- Keeps the existing **Refine** shortcut into the Logo Studio.
- Optimistic preview: the new file shows in the tiles immediately while the upload runs.

## Where it appears

1. **Brand Studio identity board** — `BrandIdentityHeader` swaps its read-only `MarkPanel` for `LogoSetPanel`. The board becomes editable in place; no need to reopen the wizard to change a logo.
2. **Top of the Brand Wizard modal** — a slim identity strip directly under the "Brand Wizard — {Venture}" title, on every step: the three preview tiles at small size plus the upload/replace affordance, so the mark is always visible and always swappable while the founder works through voice, palette and type.
3. The existing "Use my own logo" button in the logo step is replaced by the same panel, so there is one upload path, not two.

## Technical notes

- `venture-brand-assets` / `logo_upload_own` gains an optional `variant` field (`primary` | `reversed` | `icon` | `wordmark`, default `primary`). Writing a variant replaces the entry with the same variant in `venture_brand_kits.logos` rather than dropping all uploads, and only `primary` sets the `primary: true` flag. A new `logo_remove_upload` kind clears one slot.
- Reads stay backwards compatible: entries without a `variant` are treated as `primary`.
- Downstream consumers (collateral SVG, social posters, website PRD identity guard, share/export) pick `reversed` when compositing on a dark ground and `icon` for small square placements, falling back to primary. This is where the set actually pays off — dark social posters currently get the light mark.
- Uploaded logos are stored with a 7-day signed URL. That expiry will silently break older uploads, so the panel resolves URLs through a fresh signed-URL call on load instead of trusting the stored string.
- Validation: reject files over 5 MB, warn on rasters under 512 px on the long edge, sanitise uploaded SVG (strip `<script>`/event handlers) before storing.

## Out of scope

Auto-generating the reversed/icon variants from the primary mark. If you want that, it's a follow-up — the slots are the prerequisite.
