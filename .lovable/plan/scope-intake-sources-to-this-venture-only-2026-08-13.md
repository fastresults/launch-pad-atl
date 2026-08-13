# Scope intake sources to this venture only

Right now step 1 of the new-venture intake lists **every** unfiled source the founder has ever produced — that's why a July 6 scrape, `Smashburger_4.99_Menu_Is_Here...md`, is sitting in the source memory row. It was never attached to a venture, so it stays in founder-level "orphan" memory forever and reappears on every new intake.

Since the corpus is the source of truth per venture, the intake should only show what the founder is giving *this* startup.

## What changes

- **Chips = this session only.** The "Your source memory" row shows only what was added during this intake: files uploaded now, URLs scraped now, voice captured now. Nothing pre-existing is listed or pre-selected.
- **No silent auto-attach.** The current behaviour that auto-selects every readable orphan for first-time founders is removed — a source enters the venture because the founder put it there.
- **Prior material is opt-in and explicit.** A collapsed "Reuse something from earlier" panel lists unfiled sources with their date and origin. Nothing in it is selected until the founder picks it, and picking it moves that file into this venture's corpus.
- **Old orphans get an exit.** Each row in that panel gets a discreet delete so stale captures like the Smashburger page can be removed for good instead of haunting every future intake.
- **Other ventures stay separate.** The existing "sources from your other ventures" section keeps its current copy-on-select behaviour — untouched.

## Effect on the Smashburger row

It stops appearing on the intake surface. It remains in the database, reachable (and now deletable) from the "Reuse something from earlier" panel.

## Technical notes

Single file: `src/routes/_authenticated/dashboard/hub.new.tsx`, plus one small helper in `src/lib/venture-sources.ts`.

- Split state: keep `reusable` (orphans fetched via `listVentureSources({ orphansOnly: true })`) but stop feeding it into `memoryChips`. Introduce `sessionSourceIds: Set<string>` populated by `appendToMemory` (upload, URL scrape, voice) and by explicit reuse selection.
- `memoryChips` filters `reusable` to `sessionSourceIds`; `activeMemoryChips`/`memoryEmpty`/`readySourceCount` and the step‑1 gate all follow from that automatically.
- Delete the first-venture auto-select effect (the `isReturningFounder` branch that sets `reuseSelected[r.id] = true`). `countSnapshots` / `isReturningFounder` / `ventureCountLoaded` become unused — remove them.
- The reuse panel renders `reusable` minus session ids, each with `created_at` and origin label; selecting one adds to `reuseSelected` **and** `sessionSourceIds` so it shows as a chip.
- Add `deleteVentureSource(id)` to `venture-sources.ts` (delete storage object + row, then `notifySourcesChanged()`), wired to a confirm on the reuse-panel rows.
- No schema change; venture attachment on create already runs through the existing `snapshot_id` assignment path.
