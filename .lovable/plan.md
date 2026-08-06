# Finish the last assets without a manual Brand Wizard detour

## What the logs actually show

The last run (job `ada7c157…`, 21:40 UTC) finished in ~2 seconds with status
`completed_with_blockers`, 97% progress, and the note "2 asset(s) need you".

The two unfinished assets are `website_prd` and `presell_landing_prd`. Both sit at
`generation_attempts: 0` with `blocked_reason: "Lock your Brand Wizard to unlock this asset."`
There is no brand kit row for this venture at all.

So the AI never ran on them, and never will on retry: these two types are hard-gated
behind a locked Brand Wizard, and blocked assets are deliberately excluded from the
retry sweep. That is why pressing "generate remaining" does nothing and no error appears.

## The fix: derive the brand kit from the work already done

With 60 completed assets — naming, positioning, voice guide, offer, ICP — there is more
than enough context for AI to propose a brand kit. Instead of stopping the founder, the
run should derive a provisional kit and keep going.

1. **Auto-derive step.** When a gated asset is reached and no locked kit exists, the run
   calls a new `deriveBrandKit` path in the brand wizard: it reads the completed assets
   (voice guide, naming, positioning, ICP, offer) and produces palette, typography, and
   voice in the same shape the wizard writes today.
2. **Save as `auto`.** The derived kit is stored with `status: "auto"` (not `locked`), so
   the founder's own wizard run always wins and can overwrite it.
3. **Treat `auto` as good enough to generate.** The gate accepts `locked` or `auto`; only
   a completely missing kit still blocks. The prompt block labels an `auto` kit as
   provisional rather than ground truth.
4. **Generate the two assets** in the same run, so the job reaches 100% unattended.
5. **Flag it honestly in the UI.** The finished assets carry a small "Brand colors and
   voice were inferred — review in the Brand Wizard" note, with a one-click regenerate
   once the founder locks a real kit.

## Failure path

If derivation itself fails (AI error, no usable source assets), the asset falls back to
today's blocked state — but the reason becomes specific ("Couldn't infer your brand from
existing assets — open the Brand Wizard"), and the hub shows the Needs-you panel with the
Brand Wizard button instead of failing silently.

## Technical detail

- `supabase/functions/_shared/venture-context.ts` — gate helper accepts `locked | auto`;
  `brandKitBlock` renders an `auto` kit with a "provisional, may be revised" header.
- `supabase/functions/venture-brand-wizard/index.ts` — new `action: "derive_from_assets"`
  that pulls completed venture documents, calls the gateway once for palette/typography/
  voice JSON, sanitizes the palette with the existing `sanitizePaletteOption`, and upserts
  with `status: "auto"`, `dna.track: "derived"`.
- `supabase/functions/venture-bulk-generate/index.ts` — before marking a
  `BRAND_KIT_REQUIRED_TYPES` doc blocked, invoke the derive action once per run (cached in
  the job context so it fires at most once), then proceed. Only block if derivation fails.
- `supabase/functions/venture-generate-document/index.ts` — same gate change, so a
  single-asset regenerate behaves identically.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — show the "inferred brand"
  badge on the two assets and keep the Needs-you panel for genuine derivation failures.

No schema change is needed: `venture_brand_kits.status` is free text and `blocked_reason`
already exists.
