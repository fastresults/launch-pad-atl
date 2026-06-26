# AI-First Streamlining Audit

A founder currently gets asked for the same handful of facts up to **5 times** before a single document is generated. The plumbing already exists to fix it — extractors, sync helpers, a unified document library — they're just not consistently wired at the surface level. This is an audit + a fix plan, no behavior changes shipped yet.

## What I found (forensic, surface-by-surface)

The intake journey runs through **8 user-facing surfaces** before deliverables generate:

```text
Registration ─► Welcome (member_intakes) ─► Profile & Intake ─► Brief (10 Qs + FounderBlock + MarketBlock + drop-zone)
       └─► Hub.new (concept + founder + market + source docs) ─► Hub review (Setup → Story → Market → Model → Lock)
       └─► Per-deliverable Intake Gateway ─► Social Setup Intake
```

### The redundancy matrix (worst offenders)

| Fact | Times asked | Where |
|---|---|---|
| Business concept | **5×** | registration, welcome, brief, hub.new, hub review / ConceptStudio |
| Industry | **5×** | registration, MarketBlock, profile, hub.new, hub review, social setup |
| Founder name | **5×** | auth, registration, hub.new, profile, hub review, social setup |
| Problem statement | **4×** | welcome supporting_info, brief, profile, hub review |
| Target customer | **4×** | brief, profile, hub review, deliverable intake |
| Value prop / differentiators | **4×** | brief, profile, hub review, ConceptStudio |
| Source docs (deck, resume, notes) | **3×** | brief drop-zone, FounderBlock resume, hub.new file drop |
| Founder email & phone | **3×** | registration, hub.new, hub review |
| Startup stage / archetype | **3×** | registration, welcome, MarketBlock |
| Pricing | **3×** | brief, hub review, per-deliverable intake |
| Geography | **2×** | MarketBlock, hub.new (and asked again in Market Sizing intake) |
| Competitors | **2×** | hub enrichment auto-researches, then Competitive Landscape intake re-asks |

### Why this happens (root causes, not symptoms)

1. **Each surface owns its own table.** Registration writes `workshop_registrations`, welcome writes `member_intakes`, brief writes `attendee_business_brief` / `attendee_founder_profile` / `attendee_market_profile`, profile writes `attendee_profiles`, hub.new writes `venture_snapshots`, hub review writes `venture_snapshots.extracted_data`. No surface routinely reads the previous one at load time.

2. **AI extractors exist but stop short.** We already have `brief-prefill`, `founder-extract`, `venture-source-extract`, `venture-synthesize-concept`, `venture-concept-refine`. They run inside one surface and don't propagate.

3. **The "reuse a file" widget hides the files we have.** `hub.new` calls `listVentureSources({ orphansOnly: true })`, so resumes/decks already tagged to the brief are invisible — forcing re-upload.

4. **Prefill helpers re-guess instead of reading.** `buildPrefillFromBrief` regex-guesses industry from raw brief text instead of reading `attendee_market_profile.industry` that the founder already typed.

5. **No provenance UI.** Even where we prefill, the founder doesn't see "we got this from your brief" — so they retype out of distrust.

6. **`syncProfileFromBrief` is one-way.** Brief → profile works; nothing flows brief/profile → hub.new, hub.new → social setup, or finance fields → deliverable intake.

---

## Recommendations (ranked by founder-felt impact)

### R1 — One canonical fact store, read by every surface
Treat `attendee_profiles` + `attendee_business_brief` + `attendee_market_profile` + `attendee_founder_profile` as the **single canonical layer**. Add a thin `getCanonicalFounderContext(userId)` helper that returns one merged object (`{ identity, market, concept, financials, sources[] }`) and call it on mount in:
- `hub.new` — prefill founder block, industry, market scope, city/region (currently always blank), concept, track (currently always "lifestyle").
- Hub review `FounderMarketCard` — prefill from canonical, not from snapshot only.
- Social Setup intake — prefill `description`, `industry`, `founder_name`, `website`.
- Every `IntakeGatewayDialog` first-time render — seed `geography`, `competitors`, `pricing`, `cash_on_hand`, `personal_burn` from canonical before showing.

Expected reduction: ~40% of fields auto-populated on first paint.

### R2 — One source-document library, no orphan filter
Drop the `orphansOnly: true` filter in `hub.new` so docs uploaded for the Brief appear immediately as reusable context. Show them grouped ("From your Startup Brief / From a previous venture / Just uploaded"). Same widget on every surface that currently has a drop-zone (brief, hub.new, recovery, social setup intake).

Expected reduction: founders upload a pitch deck **once**, ever.

### R3 — Collapse "Welcome" into Brief block 0
`member_intakes` collects `startup_type`, `startup_name`, `one_line_idea`, `supporting_info` — every one of those is collected again in the Brief within 60 seconds. Either:
- **Drop the welcome step entirely** (recommended) and route new users straight to the Brief, OR
- Keep welcome but auto-fill brief block 1 + MarketBlock archetype from `member_intakes` so the founder reviews instead of retypes.

### R4 — Hub.new becomes a one-screen confirmation, not a re-intake
For a founder who completed the Brief, hub.new should render as a **single review card** showing the prefilled venture (name, industry, concept, location, track) with one CTA: "Start enrichment." Hide the multi-step form behind a "Tweak details" disclosure. The form re-emerges only for founders who skipped the Brief.

### R5 — Hub Review's Setup/Story/Market/Model substeps must show provenance
Each prefilled field gets a small grey tag: "from your Brief" / "from your resume" / "from your uploaded deck" / "AI extracted from sources". Founders edit with confidence instead of re-authoring out of doubt. Empty fields stay editable; filled fields collapse to one-line summaries with an "Edit" affordance.

### R6 — Per-deliverable Intake Gateway prefills from canonical + skips when complete
- Market Sizing `geography` → read from `attendee_market_profile.geography` + `venture_snapshots.city/region/market_scope`.
- Competitive Landscape `competitors` → read from enrichment data (already researched); only ask "any others we missed?"
- Pricing Strategy `price_range` → read from `attendee_business_brief.pricing_idea`.
- Financial Model `cash_on_hand` / `personal_burn` → read from `attendee_profiles.current_revenue` / `monthly_burn`.
- Funding Strategy `raise_amount` → read from `attendee_profiles.funding_raised`.
- **If all required fields are prefilled, skip the dialog entirely** and proceed to generation — show a toast "Generated using your saved context. [Review answers]".

### R7 — Social Setup Intake reads the venture, doesn't ask again
Auto-fill `description` from `venture_snapshots.business_concept` + `attendee_business_brief.unique_insight`, `industry` from canonical, `founder_name` from auth, `website` from `venture_snapshots.website_url`. Only `tone` is unique to this surface — that's the only field that should start blank.

### R8 — Two-way sync, not one-way
`syncProfileFromBrief` runs brief → profile. Add the reverse leg so when a founder edits Hub review or Profile, the canonical store updates and downstream surfaces (deliverable intake, social setup) see the new value.

### R9 — Kill the duplicate founder identity card in Hub review
`FounderMarketCard` in Hub review re-asks name/email/phone/country/city/region/industry/sub-industry/track — every field already on `venture_snapshots` from hub.new. Replace with a read-only summary + single "Edit" button that opens an inline editor, instead of a permanent re-entry form.

### R10 — Registration drops the redundant fields
`workshop_registrations.business_idea`, `industry`, `stage` are collected solely to qualify the lead, then collected again 5 minutes later in Welcome/Brief with more context. Either remove them from registration (lighter funnel) or pipe them straight into `member_intakes` + `attendee_market_profile` so they don't get re-asked.

---

## What's already in place we can build on

- `attendee_documents.extracted_text` cache (built last turn) — every uploaded doc already carries its parsed text, so re-extraction is a DB read.
- `uploadVentureSource` helper — single API every drop-zone now uses (brief, FounderBlock, hub.new, recovery).
- `syncProfileFromBrief` — proven pattern; extend to other directions.
- `venture-synthesize-concept` — can fill 12 hub.new fields from source docs; just needs to be called earlier and applied more broadly.

---

## Recommended sequencing (when you say go)

**Phase 1 — Eliminate the duplicate uploads & duplicate identity entry (1 build cycle)**
- R2 (remove orphan filter, group reusable docs)
- R9 (collapse hub-review founder/market card into read-only summary)
- R1-lite (ship `getCanonicalFounderContext` and wire hub.new + hub review prefill)

**Phase 2 — Make the Brief the single intake (1 build cycle)**
- R3 (drop or thin out Welcome)
- R4 (hub.new becomes confirmation screen when Brief is complete)
- R5 (provenance tags in hub review)

**Phase 3 — Smart deliverable + social intake (1 build cycle)**
- R6 (per-deliverable prefill & skip-when-complete)
- R7 (social setup reads venture)
- R8 (two-way sync)

**Phase 4 — Funnel slim-down (small)**
- R10 (registration trimmed or piped directly into canonical)

Net effect: a founder who completes the Brief should hit "Generate" inside the Hub on a **single confirmation tap** with **zero re-entry** of any fact they've already provided.

Want me to start with Phase 1?
