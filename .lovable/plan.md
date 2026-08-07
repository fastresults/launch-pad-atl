# Why "Regenerate website PRD" is greyed out — and the fix

## The cause (verified)

The button is disabled by `!selectedLogo`, where `selectedLogo = logos.find(l => l.primary)`.

Your venture's brand kit does have the saved Logo Studio mark, but its `primary` value is `null` — the `append_brand_logo` database function that Logo Studio calls on "Save to Live Brand" just prepends the asset to the list and never marks it primary or demotes the others. So the wizard sees "no selected mark" even though the brand is ready, and keeps the button off.

Second problem, not yet visible: the only logo link stored is a **7-day signed URL** into a private bucket. Even once the button works, any PRD that references it hands a site builder a link that dies within a week.

## The fix

### 1. Saving a mark actually makes it primary
Update `append_brand_logo` so the newly saved asset gets `primary: true` and every previously stored logo is demoted. Backfill existing kits so a kit with logos but no primary promotes its newest one — that alone un-greys the button for your current venture.

### 2. A permanent logo link per venture
Add a public `brand-logo` edge function serving the venture's primary mark at a stable path:

```text
/functions/v1/brand-logo/{snapshotId}          -> primary mark (SVG)
/functions/v1/brand-logo/{snapshotId}/horizontal|stacked|mono|knockout
```

It reads the file from the private bucket server-side and streams it with long cache headers, so nothing expires and no signed token leaks. The durable URL is stored on the logo asset as `public_url` when it is saved, so the wizard, the PRD, and any external builder all reference the same address.

### 3. The button explains itself
Keep it enabled whenever a logo exists in the kit (falling back to the newest one if no primary is flagged), and when it genuinely can't run, say why inline: "Lock your palette and typography first" or "Save a mark from Logo Studio first" — instead of a silent grey button.

### 4. The PRD actually carries the brand
Expand the brand block injected into website PRD generation so it includes:
- The durable logo URL plus each lockup variant, and the rule to use `<img src="...">` with that exact URL
- Every palette token with its hex, named by role (primary, ink, surface, accent…)
- Heading and body font families with their Google Fonts import lines and the size/weight scale
- Voice attributes and the style-guide excerpt

Then tighten the `website_prd` prompt profile so the "Brand and design tokens" section must emit a real token table from those values, and the paste-ready builder prompt at the end must inline the hexes, font imports, and the logo `<img>` tag — no placeholders.

## Technical notes

- Migration: rewrite `public.append_brand_logo` (set `primary` on insert, demote the rest) + one-time backfill update.
- New function `supabase/functions/brand-logo/index.ts`, `verify_jwt = false` in `config.toml`; resolves the path from `venture_brand_kits.logos` via the service role, 404s cleanly when nothing is published.
- `supabase/functions/_shared/venture-context.ts` → `brandKitBlock()` emits the durable URL and the full token table.
- `supabase/functions/_shared/prompt-profiles.ts` → `website_prd.systemExtra` gains the token/logo requirements.
- `supabase/functions/venture-logo-studio/index.ts` → stamps `public_url` and `primary: true` onto the committed asset.
- `src/components/hub/brand-wizard/BrandWizard.tsx` → fallback selection + reason text on the PRD button.
