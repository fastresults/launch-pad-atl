# Higher-quality brand workshop images

## Recommendation

The current scene images were generated on the `fast` tier, which is why the composition reads right but the detail falls apart — mangled hands, garbled signage text, smeared faces, plasticky lighting.

Move image generation for these scenes to the **premium** tier:

- **`premium` (Gemini 3 Pro Image / Nano Banana 2)** — best all-round photographic realism, clean hands and faces, correct materials and lighting. This is the recommended default for the scene library.
- **`premium.gpt` (GPT-image-2)** — use only for a frame where legible printed text matters (a sign, a menu board, a laptop screen). Stronger typography, slightly more "rendered" look on skin.

Cost is higher per image, but these are ten one-time hero assets, so it's the right trade.

## Scope of this pass

Replace the ten Brand workshop pain images in `src/assets/scenes/workshops/brand-identity/`, keeping the exact same filenames so the glob-based rotation picks them up with no code change:

`ai-slop-assets`, `cant-raise-prices`, `cheap-first-impression`, `designer-keeps-asking`, `everything-looks-different`, `invisible-next-to-competitors`, `logo-picked-too-fast`, `no-color-typography`, `no-words-for-it`, `rebrand-bill-coming`

## Prompt discipline for the regeneration

Each prompt keeps the existing pain concept and the site's cinematic midnight-navy look, and adds the quality guardrails that fix the "AI mistakes":

- Photographic language: 35mm or 50mm lens, shallow depth of field, natural window or practical light, film grain.
- Composition kept as-is: single subject, off-center, negative space on one side for hero text, dark navy environment with warm gold practical accents.
- Avoid the failure modes: no visible hand close-ups holding small objects, no readable body copy or logos in frame, faces turned partly away or mid-distance, no crowds.
- Wide framing at 1920x1080 so the hero can crop without softening.

## Verification

Re-render the Brand hero rotation in the preview at desktop and mobile widths, and review each of the ten frames at full size before calling it done. Any frame with visible artifacts gets one regeneration pass, switching to `premium.gpt` if the issue is text.

## Follow-on (not in this pass)

Once Brand looks right, the same treatment applies to the other seven build workshops (70 images) and, separately, the 107 founder hero scenes. Those run as their own passes so each set can be reviewed.
