## Hero update — add the ATL Founder-Friendly Accelerator seal

The attached screenshot shows the seal sitting prominently on the right side of the hero, balancing the headline/CTA on the left. The current hero is left-only.

### Changes

1. **Download the seal asset**
   - Fetch the signed SVG from the master-media bucket and save as `src/assets/atl-founder-friendly-seal.svg` (committed asset so it works regardless of signed-URL expiry).

2. **Update `src/components/home/HomeFramework.tsx` → `Hero`**
   - Wrap inner content in a two-column flex layout at `lg+`:
     - Left column (existing): eyebrow pill, H1, paragraphs, CTAs, proof-point strip, meta grid. Constrain to roughly `lg:max-w-2xl` so headline wraps like the mock.
     - Right column: the seal, vertically centered, `max-w-[340px] lg:max-w-[400px]`, with a subtle drop-shadow. Hidden on `< md`, shown from `lg` up to keep mobile clean (on `md` it could show smaller above CTAs — final call: `hidden lg:flex` to match the mock exactly).
   - Use `<img src={seal} alt="ATL Founder-Friendly Accelerator seal" />` with `loading="eager"` and `decoding="async"`.
   - Keep all existing copy, gradient text, background, and CTAs untouched.

3. **No changes** to other sections, tokens, or copy.

### Out of scope
- Mobile placement of the seal (kept desktop-only to match mock; can revisit if you want it on mobile too).
