# Why the logo reads small and the letterforms look rough — and the fix

I pulled the actual saved artwork for this venture and measured it. Both problems are real and measurable, and neither is a taste call.

## What I found

**1. Roughly 44% of the logo file is empty padding, and the specs don't know it.**

The saved mark is `1408 x 768`. The real ink (house + figures + wordmark) sits inside `x 152–1277, y 150–583` — so the drawn artwork is only **56% of the file's height** and 80% of its width.

Every print spec sizes the logo as a fraction of trim *height* — e.g. a business-card lockup at 16–24% of card height. Because the box is measured against the file, not the ink, a "22% of card" lockup lands as **~12% of actual ink**. That is exactly the "always a bit too small" you're seeing, on every piece, consistently.

The aspect ratio is wrong for the same reason: the code reads 1408/768 = 1.83, while the ink is really 2.60 wide. Height-driven fitting then shrinks it again.

**2. The wordmark is a bitmap trace, not type.**

The file contains **107 paths and zero text** — the company name was auto-traced from a raster preview into polygons. Traced letterforms have wobbly stems, filled-in counters and chipped edges; that is the fuzz you see on "Anderson Elderly Residences Inc." at any real print size. The brand's heading face (Lora) is recorded on the record but the letters on the card are not set in it.

Also worth naming: 12 of those paths are white background plates that the stripper has to guess at, and collateral always loads the wide *lockup* file even where a piece calls for a compact symbol.

## The fix

**Measure ink, not the file**
- Compute the true ink bounding box of the saved vector once (ignoring white plates), cache it on the brand record, and place the mark by that box. A spec that says 22% of card height then puts 22% of *visible logo* on the card — an immediate ~1.8x jump on every piece, with no spec changes.
- Use the ink aspect for fitting and clear space, so wide lockups stop being squeezed into square slots.
- Same correction feeds QC, so the measured mark height is compared like-for-like against the band.

**Raise the bands where the standard supports it**
- With honest measurement in place, push the bias toward the top of each band (business card front lockup to ~24% of trim height, letterhead ~9%, envelope ~20%, notecard ~26%) instead of the current midpoint pick.

**Clean letterforms: stop shipping traced type**
- Prefer a **symbol-only** mark plus the company name set live in the brand's real heading face (outlined from the actual font file) wherever a lockup is needed. That path already exists in the lockup builder — collateral just never uses it because it loads the traced lockup file.
- Derive and store a symbol-only variant when the saved artwork is a full lockup: keep the paths inside the symbol's ink region, drop the traced wordmark.
- If no symbol can be isolated, fall back to the traced lockup but never below the size where trace artifacts show, and flag the piece so the founder knows to re-run the mark.

**Guard it**
- QC gains two checks: measured *ink* height inside band (not file height), and a trace-quality signal — if the mark is a traced lockup with no real type, the piece is marked "traced artwork" in the library with a one-click path back to the Logo Studio to regenerate a clean symbol + typeset wordmark.

## Technical notes

- New `_shared/logo-geometry.ts`: ink-bbox measurement (parses path/polygon geometry, excludes near-white plates), symbol-region isolation, cached per brand kit.
- `_shared/collateral-svg.ts`: `markAt` translates/scales by ink bbox rather than viewBox; `logoAspect`/`isLockup` use ink dimensions; `logoBlock` prefers symbol + outlined wordmark.
- `_shared/collateral-specs.ts`: bias raised toward band max; bands revisited now that measurement is honest.
- `_shared/collateral-qc.ts`: compare against ink height; add traced-artwork verdict.
- `venture-collateral/index.ts`: load symbol variant when present; store the new verdict.
- `BrandCollateral.tsx`: surface the traced-artwork flag with a link to regenerate the mark.

## Order of work

1. Ink-bbox measurement + placement (largest visible win, affects all 9 pieces).
2. Symbol isolation and outlined-wordmark lockup.
3. Band/bias raise, QC updates, library flag.
