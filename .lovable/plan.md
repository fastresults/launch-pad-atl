## Change

In `src/components/hub/social/SocialAutopilot.tsx`, Step 5 "Generating your channel kits" — wrap each per-platform section in a shadcn `Accordion` (type `multiple`, all open by default) so users can collapse/expand any channel.

## Details

- Replace the current per-platform section container with `AccordionItem` (value = platform key).
- Move the existing platform header row (icon + name + subtitle + "N/N ready" pill) into `AccordionTrigger` so the chevron sits on the right; keep the ready pill visible in the collapsed state.
- Move the tile grid (avatar/cover cards) into `AccordionContent`.
- Wrap all sections in a single `<Accordion type="multiple" defaultValue={allPlatforms}>` so every channel starts expanded (matches today's behavior) and users can independently collapse any.
- Keep animations from the existing `accordion.tsx` primitive; no styling changes to tiles, buttons, or generation logic.

## Out of scope
- No changes to generation, regenerate, preview modal, delete, or edge functions.
- No layout changes inside tiles.

## Files touched
- `src/components/hub/social/SocialAutopilot.tsx`
