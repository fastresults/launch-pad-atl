# Fix: "venture_snapshots_track_check" blocks new venture creation

## Confirmed cause

The app's track list and the database's allowed-track rule disagree.

- The app (`src/lib/tracks.ts`) offers: `lifestyle`, `ecommerce_dtc`, `scalable_tech`,
  `marketplace`, `deep_tech`, `social_impact`, `corporate`.
- The database rule `venture_snapshots_track_check` allows: `lifestyle`, `small_business`,
  `scalable_tech`, `marketplace`, `deep_tech`, `social_impact`, `corporate`.

`ecommerce_dtc` — the "Online / DTC / Digital Brand" track, one of the two defaults on
the picker — is not in the database list, and `small_business` no longer exists in the
app. Selecting the DTC track therefore fails the insert with exactly the error shown.

Existing data: 3 snapshots, all `lifestyle`. No rows use `small_business`, so nothing
needs migrating.

## Fix

One migration that replaces the check constraint on `public.venture_snapshots.track`
so the allowed values match the app's seven track keys:

`lifestyle`, `ecommerce_dtc`, `scalable_tech`, `marketplace`, `deep_tech`,
`social_impact`, `corporate` (plus NULL, as today).

The constraint keeps the same name so nothing else has to change.

## Verification

After the migration runs, create a venture on the "Online / DTC / Digital Brand" track
and confirm it saves, then re-read the constraint definition to confirm all seven keys
are present.

## Scope

Database only — one migration. No schema shape change, no RLS change, no code change.
