Remove the `CapabilityGrid` section (the 8-card "Same eight capabilities as the workshops" grid) from `/services`.

**`src/routes/services.tsx`:**
- Remove `<CapabilityGrid />` from the page composition (line 25).
- Delete the `CapabilityGrid` function (lines ~77–155) and its section-header comment.
- Drop now-unused imports: `AGENCY_SERVICES`, `getBuildWorkshop`, `Check`, `Clock` (keep `AGENCY_TRACKS`, `getAgencyService` — Tracks still uses them).

No other sections touched. Tracks, Process, Proof, WorkshopBand, FAQ, FinalCTA remain.
