
## Problem

For "Startup Workshops," the model rendered a carpenter in a woodshop. We already have `LITERAL_WORD_GUARDS` and a Subject brief, but they arrive as *negative* instructions after the brand name. Image models weight the earliest, most concrete noun phrases most heavily — so "Workshops" wins before the guardrails are read.

Root cause: context is present but **not resolved into a scene** before the model sees the brand name. We're asking the model to reason ("don't take this literally") instead of handing it a pre-decided subject.

## Fix: Pre-resolve a Scene Directive, put it first, demote the brand name

### 1. New deterministic resolver in `cover-art-director.ts`

Add `resolveSceneDirective(ctx)` that returns a small, opinionated object built from `industry`, `track`, `customer`, `concept`, `problem`, `solution` — never from the brand name:

```
{
  depict:   "A diverse cohort of early-stage founders in a bright modern
             coworking space, laptops open, sticky notes on glass walls,
             facilitator mid-gesture at a whiteboard.",
  subjects: ["founders", "facilitator", "laptops", "whiteboard", "sticky notes"],
  setting:  "modern coworking / accelerator studio, daylight",
  mood:     "focused, collaborative, optimistic",
  avoid:    ["workbench","hand tools","sawdust","lumber","aprons","machinery"]
}
```

Resolution rules (track/industry first, brand name never):
- Track `main_street` → local small-business owner in their shop/office.
- Track `tech`/`startup` → founder cohort in accelerator setting.
- Industry `food`, `fitness`, `services`, etc. → matching authentic setting.
- Fallback → founder cohort scene.
- `avoid[]` is auto-populated from the same `LITERAL_WORD_GUARDS` table so bans stay in sync.

### 2. Reorder the prompt

Today the prompt reads: brand name → subject brief → guardrails.
Change to:

```
SCENE DIRECTIVE (highest priority — depict exactly this):
  DEPICT: <depict>
  KEY SUBJECTS: <subjects joined>
  SETTING: <setting>
  MOOD: <mood>
  DO NOT DEPICT: <avoid joined>

BRAND CONTEXT (identity only — not a scene description):
  Brand name: "<name>"  ← treat as a label, not a subject
  Industry / Track / Customer / …
```

Two behavioral shifts:
- The Scene Directive is the first noun-heavy block the model reads.
- The brand name is explicitly reframed as a label, not a subject, so tokens like "Workshops" stop competing with the directive.

### 3. Reinforce at the end

Append one line to the closing `Never let the brand name…` sentence:

> "If the Scene Directive and the brand name conflict, the Scene Directive wins. The brand name is a wordmark, not a subject."

### 4. Regeneration parity

Regeneration already re-runs the director, so no call-site changes needed — the new directive rides along automatically. `venture-social-cover` and `venture-style-preview` just need redeploy.

## Files

- `supabase/functions/_shared/cover-art-director.ts` — add `resolveSceneDirective`, restructure prompt ordering, keep `LITERAL_WORD_GUARDS` as the `avoid[]` source of truth.
- Deploy: `venture-social-cover`, `venture-style-preview`.

No DB or UI changes.

## Verification

Regenerate the Twitter header for Startup Workshops with headline "Adam Rocks!" — expect a founder-cohort/coworking scene, no woodshop, brand purple retained, logo lockup unchanged.
