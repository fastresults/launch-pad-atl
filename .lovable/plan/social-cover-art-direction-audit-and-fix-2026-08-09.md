# Social cover art direction — audit and fix

## What I found (verified against this venture's saved prompts)

Your venture is **UCG Production & Syndication Agency** — industry `SIC 7311 — Advertising Agencies`, sub-industry `UGC creation and syndication`, track `ecommerce_dtc`, serving single-SKU DTC brands.

The scenes actually sent to the image model on your last three covers were:

- YouTube channel art: *"Aerial of a coastal highway curving along cliffs at sunrise, one car on the road."*
- Facebook cover: *"A lone silhouette of a founder against a floor-to-ceiling window at night."*
- YouTube thumbnail: *"A stack of business cards fanned across a linen surface."*

So: no, there is no connection between the images and the service. That is not the model wandering — it is exactly what the code instructed, word for word.

### Root cause

`supabase/functions/_shared/cover-art-director.ts` decides the scene from a fixed set of hand-written scene libraries via `pickLibrary(track, industry)`. It only has libraries for care, main street, food, fitness, health, and mobility. Everything else — including a creator/UGC/advertising agency — falls through to `LIBRARY_STARTUP`, a bag of generic founder metaphors: coastal highways, mountains, compasses, paper airplanes, chess pieces, torn paper. Your venture's concept, offer, and customer are printed in the prompt as "subject context" only, and the SCENE DIRECTIVE explicitly outranks them ("HIGHEST PRIORITY — depict exactly this scene").

Two secondary defects visible in the same prompts:

1. **Camera and composition are re-rolled independently of the chosen scene.** The Facebook cover asked for a full-body silhouette against a window *with* the composition "close macro detail of hands + object, shallow focus, no full face." Contradictory directions produce mush.
2. **`DO NOT DEPICT: (none)`** on every asset — the anti-cliché guard only fires on literal brand-name words, so nothing venture-specific is ever banned.

## The fix: derive the scene from the business, don't look it up

### 1. Venture-specific scene briefs, generated once and cached
Add a scene-brief pass that reads the venture brain (concept, offer, customer, delivery model, setting, artifacts) and produces 8–12 concrete, shootable scenes for *that* business — with subject, setting, camera, light, mood, and a per-scene ban list — stored on the snapshot and reused across every cover, ad, and post. For UCG that yields things like a creator filming a single product on a phone rig at a kitchen counter; a wall of vertical phone frames each showing a different creator take; a shipping box of one SKU being unboxed under a ring light; a media buyer scrubbing a variant grid.

### 2. Static libraries become fallback only
`pickLibrary` stays as a cold-start safety net, but is used only when the derived brief is unavailable. Add an agency/creator/marketing-services library so even the fallback is closer than a coastal highway.

### 3. Coherent directive assembly
Camera and composition stop being independently randomized. Each scene carries its own compatible camera/composition pair; rotation picks a different *scene*, not a mismatched framing for the same scene.

### 4. Real ban lists
The DO-NOT-DEPICT line is populated from the derived brief for every venture — for an agency: no stock handshakes, no coastal aerials, no mountains, no torn-paper abstractions, no lone-founder-at-window, no business-card flat-lays, no unrelated travel props.

### 5. Relevance QA before the asset is saved
Extend the existing QA pass with a cheap vision check: "does this image plausibly depict the described scene for a business that does X?" A miss triggers one corrective retry rather than saving an off-topic cover.

### 6. Founder-visible scene control
Show the decided scene line in the Social Studio card before generating, with a "different scene" shuffle and a free-text override. You should never learn what the model was told only after paying for the render.

## Files touched

- `supabase/functions/_shared/cover-art-director.ts` — brief-first resolver, coherent camera/composition pairing, populated ban lists, agency/creator fallback library.
- New `supabase/functions/_shared/scene-brief.ts` — AI-derived, cached per-snapshot scene briefs from the venture brain.
- `supabase/functions/venture-social-cover/index.ts` — load/derive brief, pass scene override, run relevance QA + one retry.
- `supabase/functions/_shared/image-qa.ts` — scene-relevance check.
- `SocialAutopilot.tsx` — show the decided scene, shuffle, and override field.
- Same director path also feeds `venture-content-ad` and `venture-style-preview`, so Content Studio inherits the fix.

Cached briefs are stored on the existing snapshot record; no new table required.

## Verification

Regenerate the LinkedIn, Instagram, and TikTok assets and confirm the saved `prompt_used` SCENE DIRECTIVE names creator/UGC/DTC subject matter, that the ban list is non-empty, and that camera and composition no longer contradict the scene.
