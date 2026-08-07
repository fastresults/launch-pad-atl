# Sharper Social Studio art direction (and the model question)

## The model answer first

Social Studio is already on the highest-quality image model available: **Gemini 3 Pro Image** (`google/gemini-3-pro-image`), because it's the only top-tier model that accepts your logo + palette tile as reference images. There is no higher-end generator to upgrade to on the gateway.

But there's a catch that explains what you're seeing: when the multimodal call fails or times out, the code silently falls back to **gpt-image-2 at `quality: "medium"`** — a text-only call that never sees your logo or palette. That fallback is very likely what produced the stock-photo LinkedIn header and the mangled lettering.

So the fix is not "buy a better model." It's: stop the low-quality fallback from shipping, and stop asking any model to draw letters.

## What changes

**1. Kill misspelled text at the source**
Covers currently let the model paint headlines. Models misspell — always will. Content Studio ads already solved this: the model renders a zero-glyph composition with reserved negative space, then we typeset the headline server-side in the real brand font. Bring that same path to social covers, so every word on a cover is real typography, correctly spelled, in Lora/Inter.

**2. Make the fallback a proper fallback**
- Raise gpt-image-2 to `quality: "high"` and give it the palette/brand description inline (it can't see reference images).
- Retry Gemini once on timeout before falling back.
- Tag any fallback-produced asset visibly in the preview modal ("generated without brand references — regenerate recommended") so an off-brand render never looks approved.

**3. Tighter art direction from the venture, not from a genre**
- Feed a decided scene brief from the venture brain — who is served, where the work happens, what a real moment looks like — instead of a generic direction adjective. Anderson Elderly Residence should never surface passports or business-card mockups.
- Add an explicit ban list per venture: no unrelated props, no generic office/travel/tech stock tropes, no signage, no screens with text.
- Per-platform composition rules (LinkedIn banner: subject to one side, wide clear band for the logo; Facebook: center-safe zone; Instagram avatar: single centered mark on a flat brand field, no scene at all).

**4. Placement QA that actually blocks a bad render**
- Extend the existing QA pass to check: any glyphs present when zero-glyph was requested, subject crossing the reserved logo zone, or subject cropped at a platform's known crop. On failure, retry once with a corrective note rather than shipping it.

**5. Avatars**
Instagram's avatar is empty. Avatars stop going through scene generation entirely — flat brand surface plus the composited mark, deterministic and always on-brand.

## Technical notes

- `supabase/functions/venture-social-cover/index.ts` — pass `serverRenderedHeadline: true`, call `compositeHeadline()` after generation; add one Gemini retry before fallback; `quality: "high"` on `MODEL_FALLBACK`; record `used_fallback` in `qa`.
- `supabase/functions/_shared/cover-art-director.ts` — venture-derived scene brief + prop ban list + per-platform composition block.
- `supabase/functions/_shared/image-qa.ts` — add glyph-presence and reserved-zone-intrusion checks.
- `SocialAutopilot.tsx` / preview modal — surface the fallback warning badge.
- Same director/QA changes carry to `venture-content-ad` and `venture-style-preview`.
