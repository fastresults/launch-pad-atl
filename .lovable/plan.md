# Brand Development & Social Media — comprehensive expansion

Add a full brand-framework pipeline and a comprehensive social media setup + content strategy to the AI-first workflow, alongside the previously approved Epiphany Engine. Everything is driven by the locked concept summary + value proposition so output stays on-message.

## 1. New documents in the catalog (added to `venture_document_types`)

### Brand Development (new category "Brand", sort 9.x — runs after value_proposition)

- **brand_strategy_framework** — full brand-strategy doc using a recognized framework:
  Purpose → Vision → Mission → Values → Audience archetypes → Brand promise → Positioning statement (Geoffrey Moore template) → Brand pillars (3–5) → Personality (Jung archetype + 5 trait spectrum) → Brand essence (one phrase). Deps: `value_proposition`, `competitive_positioning`.
- **brand_messaging_house** — Messaging architecture: tagline + 3 variants, elevator pitch (15/30/60s), brand story (StoryBrand 7-part), proof points, key messages per audience, do/don't language guide, banned phrases. Deps: `brand_strategy_framework`.
- **visual_identity_brief** — Logo direction (concept + 3 mood pairings), color system (primary/secondary/neutral with hex + usage + accessibility AA contrast notes), typography pair (heading/body with fallbacks), iconography style, photography direction, layout principles, accessibility checklist. Outputs a paste-ready prompt block for AI logo/identity tools (Midjourney/Ideogram/Looka) plus a brand-tokens JSON the website_prd can consume. Deps: `brand_strategy_framework`.
- **brand_voice_tone_guide** — Voice attributes (4 dimensions with sliders + examples), tone shifts by context (sales, support, crisis, social), reading-level target, sample rewrites (before/after × 5), inclusive-language rules. Deps: `brand_messaging_house`.
- **brand_guidelines_pdf** — Final consolidated brand book combining the above with do/don'ts, asset usage, file-naming, governance ("who approves what"). Deps: `visual_identity_brief`, `brand_voice_tone_guide`.

### Social & Content (new category "Social & Content")

- **social_media_audit_setup** — Per-platform recommendation matrix (Instagram, TikTok, LinkedIn, X, YouTube, Facebook, Pinterest, Threads, Reddit) scored Yes/Maybe/Skip for THIS venture with rationale tied to market_scope + industry + research_brief. For each "Yes" platform: handle availability checklist, profile setup (bio templates × 3, link-in-bio structure, profile/cover image specs, pinned-post strategy, highlight covers), keyword/hashtag seed list (15–25), follow-list of 25 accounts to engage. Deps: `brand_voice_tone_guide`, `customer_personas`.
- **content_strategy_pillars** — Content pillars (4–6), each with: theme, audience job-to-be-done it serves, % of mix, formats, voice notes, success metrics. Includes content-to-funnel map (TOFU/MOFU/BOFU/loyalty %), POV statements, banned topics. Deps: `social_media_audit_setup`, `value_proposition`.
- **content_calendar_90day** — 90-day editorial calendar: 3 posts/week minimum per primary platform, organized by pillar with title + hook + body outline + CTA + format + asset notes + best-time slot. Week 1–4 has full-text drafts; weeks 5–12 are outlined briefs. Includes batch-production schedule and repurposing matrix (1 long-form → 5 short-form derivatives). Deps: `content_strategy_pillars`.
- **launch_content_kit** — Ready-to-paste launch sequence: 10 launch posts across formats (announcement, founder story, problem post, solution demo, social proof, FAQ, CTA, behind-the-scenes, manifesto, partnership-ask), each with caption + image/video prompt + hashtags + alt-text. Includes 5 email/DM templates and a press one-pager. Deps: `content_calendar_90day`, `brand_messaging_house`.
- **community_engagement_playbook** — Reply scripts (10 scenarios), comment-prompt formulas, DM funnel, UGC + testimonial-collection scripts, crisis-response tree, weekly engagement ritual (60-min/day plan), KPI dashboard (reach, saves, shares, replies, profile visits → site visits → leads). Deps: `social_media_audit_setup`, `brand_voice_tone_guide`.
- **influencer_partnership_brief** — Tiered creator-target list (nano/micro/mid) with 25 named candidates derived from research_brief + Perplexity search of `{industry} creators in {location}`, outreach scripts × 3, partnership terms template, performance tracking template. Deps: `content_strategy_pillars`, `customer_personas`.
- **paid_ads_starter_pack** — Budget-tier plans ($300 / $1k / $3k monthly), platform allocation, 3 ad-creative concepts per platform with copy + visual prompts, audience definitions, conversion-tracking setup checklist (Pixel/CAPI), test-and-iterate framework. Deps: `content_strategy_pillars`, `customer_personas`.

That's **5 brand docs + 6 social/content docs = 11 new types**, bringing the catalog from 21 → 32. All marked `free_tier: false` except `brand_strategy_framework`, `social_media_audit_setup`, and `content_strategy_pillars`, which stay free so even base users get the foundation.

## 2. Generator upgrades

`venture-bulk-generate` + `venture-generate-document`:

- Each new doc gets a specialized system prompt branch (like the existing `website_prd` branch). Brand docs reference a recognized framework explicitly in their prompts (Simon Sinek Golden Circle, StoryBrand, Jung archetypes, Aaker brand identity prism, Geoffrey Moore positioning) so output is structured and recognizable, not generic.
- `visual_identity_brief` and `brand_guidelines_pdf` emit a fenced ```json brand_tokens block (colors, fonts, spacing). The `website_prd` generator is updated to read upstream `brand_tokens` and reference them in its paste-ready prompt — closes the loop so the website matches the brand.
- `social_media_audit_setup` calls Perplexity once for fresh platform-trend data scoped to industry + market.
- All content/social docs receive `brand_voice_tone_guide` as upstream context when present, ensuring caption voice = brand voice.

## 3. Brand Studio panel (UI)

New `src/components/hub/BrandStudio.tsx`, rendered on `hub.$snapshotId.tsx` in the Generate step as a dedicated section above the document grid (collapses once docs are complete). Shows:

- **Brand status bar** — visual identity (color swatches + typography preview from `brand_tokens`), voice attributes pulled from `brand_voice_tone_guide`, one-line positioning statement.
- **Asset actions** — "Generate logo concept" (calls imagegen tool through an edge function with the visual_identity_brief prompt; saves 4 variations to `media_assets`), "Generate social profile pack" (square + cover images per platform, sized correctly), "Export brand book PDF" (renders brand_guidelines_pdf markdown to PDF in the browser).
- **Copy-prompt buttons** for paste-ready blocks (logo prompt, Midjourney mood prompt, Canva brief).

## 4. Social Studio panel (UI)

New `src/components/hub/SocialStudio.tsx`, rendered in the Generate step below Brand Studio:

- **Platform matrix** rendered from `social_media_audit_setup` with Yes/Maybe/Skip badges + handle-availability checker (links out to namechk.com style search per platform).
- **Content calendar viewer** — week-grid view of `content_calendar_90day`, click a cell → full post draft + "Copy", "Schedule" (deep-links to Buffer/Hootsuite/native composer with pre-filled body), "Regenerate" (single-post regenerate via existing generate path with a targeted prompt).
- **Launch kit** — 10 launch posts as cards, each with copy/image/hashtags + Copy + "Generate image" button (imagegen).
- **KPI tracker stub** — placeholder for connecting analytics later (clearly marked future).

## 5. Brand-asset image generation

New edge function `venture-brand-assets`:
- Takes `{ snapshotId, kind: 'logo'|'social_profile'|'social_cover'|'launch_post', count, platform? }`.
- Loads `visual_identity_brief` + `brand_tokens`, constructs a model-specific prompt, calls `google/gemini-3-flash-image` (Nano Banana — fast, good for marketing) or `google/gemini-3-pro-image` for logos.
- Persists outputs as rows in `media_assets` tagged `brand_kit:{snapshot_id}` so they appear in the founder's media library.
- Concurrency-capped (max 4 in flight).

## 6. Data + types

Migration adds 11 rows to `venture_document_types`. No schema changes needed beyond that — existing `venture_documents` table already stores arbitrary markdown content. `media_assets` already exists.

Optional small addition: `venture_snapshots.brand_tokens jsonb` mirrored from the latest `visual_identity_brief` for fast read by Brand Studio + website_prd (avoids re-parsing markdown).

## 7. Carry-over from prior plan

This plan keeps the previously approved **Epiphany Engine** as-is (multi-step pipeline, top-3 enhancement cards, viability + attractiveness scoring). The Epiphany's "Fold into concept" path now also triggers a regeneration of `brand_messaging_house` and `content_strategy_pillars` when those docs already exist (marks them stale with a one-click "Regenerate to match new concept" button).

## Open choices

1. **Catalog size** — ship all 11 new docs, or start with the 6 highest-impact (brand_strategy_framework, brand_messaging_house, visual_identity_brief, social_media_audit_setup, content_strategy_pillars, content_calendar_90day) and add the rest in a phase 2?
2. **Logo generation model** — default to Nano Banana (fast/cheap, 4 variants in ~15s) or `gemini-3-pro-image` (slower, higher quality, 2 variants)?
3. **Calendar depth** — full 12 weeks of post drafts (longer generation, more credits), or 4 weeks drafted + 8 weeks outlined (recommended)?
4. **Platform coverage** — cover all 9 platforms in the audit even if most score Skip, or only render the Yes/Maybe set in `social_media_audit_setup`?
