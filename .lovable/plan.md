# Kill the logo bounding-box artifact

## What's happening

In your screenshot the top-left has a faint rectangular outline around the Startup Labs logo. That outline was painted by the image model, not by our compositor (the compositor only draws a chip for opaque logos, and a transparent PNG goes through the direct-composite path with no chip). The model drew it because our prompt keeps telling it about a "reserved rectangle" / "reserved logo zone" / "clean rectangular space" — and models routinely respond by drawing a visible boundary around that region (a hairline stroke, a thin rule, a ghosted frame, a slightly different fill) so the composition "reads" as intentional.

## Fix

Change the prompt language so the reserved area is described as **invisible negative space**, and add an explicit hard ban on any border, frame, outline, rule, or divider anywhere near the logo area. One file, three targeted edits — all in `supabase/functions/_shared/cover-art-director.ts`.

### 1. Rewrite the reserved-zone directive (`zone(...)` helper)

Replace the current wording that repeats the word "rectangle" with copy that describes the zone as unmarked negative space, e.g.:

- Remove "the top-left ~X% × Y% **rectangle**" phrasing.
- State the area MUST contain no stroke, no outline, no border, no frame, no hairline, no divider, no rule, no drop-shadow, no gradient edge, no tonal shift, no ghosted box, no debossed panel, no watermark, and no bracket marks.
- State the surrounding composition must continue up to the edges as if the logo zone did not exist — no framing device around it, no negative-space "window" cut out for it.
- Keep the "we composite the actual logo on top later" note.

### 2. Add the same ban to `BANNED`

Add two lines to the HARD BANS block:

- "Any visible border, outline, frame, rule, hairline, or divider around the logo area or anywhere on the canvas. The logo is placed on the raw image with no container, no chip, no plate, no card."
- "Any rectangular tonal panel, ghosted box, or 'placeholder' shape near the logo corner. Treat the logo area as unmarked negative space that continues the surrounding composition."

### 3. Reinforce in `references`

Update the "Image #1" note to add: "Do NOT draw any container, frame, plate, card, or outline around where the logo will land. The logo sits directly on the composition."

## Compositor: no change needed

`logo-compositor.ts` already uses the direct-composite path (no chip) for transparent PNGs like the Startup Labs mark. It only draws a rounded chip for opaque logos where a chip is necessary for legibility — that's the correct behavior and shouldn't change.

## Deploy

Redeploy `venture-social-cover` and `venture-style-preview` so both the cover pipeline and the style previews pick up the new prompt language.

## Verification

Regenerate the same Startup Workshops header. The logo should land in the top-left with no rectangular outline, no ghosted frame, and no tonal panel around it — the surrounding composition continues unbroken up to the logo pixels.
