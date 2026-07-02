# Retain venture context on regeneration

## The problem

When you regenerated the cover for "Startup Workshops" with the headline **"Adam Rocks!"**, the model produced a young man in a carpentry workshop. Context wasn't literally lost on the round-trip — the edge function still reloads the full venture on every call. The real problem is two-fold:

1. **`ventureBlock` in `supabase/functions/_shared/cover-art-director.ts` sends the model almost nothing about the venture** — just `Name`, `One-liner`, `Customer`, `Differentiators`. No industry, no track, no problem/solution, no visual subject guidance. With a name like "Startup Workshops," the model latches onto the word "workshop" literally.
2. **When the founder picks a custom headline ("Adam Rocks!") or "no text", we intentionally hide the one-liner** (`hideCopy` branch) to stop the model from painting competing copy on the canvas. That's correct for *rendered text*, but it also strips the last shred of subject context the model had, so nothing is left to anchor the scene.

Result: model reads `Name: Startup Workshops` + a punchy headline + no subject → invents a literal workshop scene.

## The fix

Rewrite `ventureBlock` and the prompt scaffolding so the model always receives a rich, unambiguous **Subject Brief** — separate from the on-image headline policy — that regeneration cannot strip.

### 1. Enrich `ventureBlock` (`supabase/functions/_shared/cover-art-director.ts`)

Always emit, regardless of headline mode:

- Company name
- Industry / sub-industry / track (pulled from `ctx.snap`)
- What the venture IS in one plain sentence (concept summary or brain one-liner) — as **subject context, not on-image copy**
- Who it serves (customer)
- Problem + solution (short)
- Differentiators
- **Literal-word guardrails**: an auto-derived "DO NOT interpret literally" line built from tokens in the company name that have common non-startup meanings (`workshop`, `lab`, `studio`, `garage`, `kitchen`, `forge`, `atelier`, `factory`, `hub`, `foundry`, `works`, etc.). Example emitted line:
  > "Workshop" here means a facilitated founder-education session — NOT a carpentry / mechanical / craft workshop. Do not depict workbenches, tools, sawdust, aprons, or artisan trades.

Mark this block "SUBJECT CONTEXT (for scene comprehension only — do NOT render as text on the canvas)". This resolves the tension with the headline-suppression branch: the model gets full context but knows the words don't belong on the pixels.

### 2. Stop stripping context in custom / none headline modes

Remove the `hideCopy` branch that suppressed `oneLiner` when the founder picked a custom headline. The existing `PRIMARY TEXT OBJECTIVE` block (already forbids any glyph except the override) is sufficient to keep the one-liner off the canvas.

### 3. Add a `SUBJECT BRIEF` section to the prompt

In `buildCoverArtPrompt`, insert a top-level `## Subject brief` section above `## Composition system`, sourced from the enriched `ventureBlock`. Include a one-line "Visual anchor" derived from `industry` + `customer` (e.g., "founders and small-business owners going through a startup accelerator") so the model has an explicit scene target instead of guessing from the name.

### 4. Propagate the same subject brief to the avatar + preview paths

`buildAvatarPrompt` doesn't need scene context (it just places the logo), so no change there. `venture-style-preview` uses the same director — it inherits the fix automatically. Verify the style-preview edge function still passes `ctx` through unchanged.

### 5. Feedback continuity on regenerate

The current regenerate path already reloads `loadVentureContext` fresh every call, so nothing to change server-side for persistence. Add one safeguard in `SocialAutopilot.regenerateSingle`: log a warning if the response's `ctx.snap.company_name` differs from the tile's expected venture, so we catch any future drift in QA.

## Files touched

- `supabase/functions/_shared/cover-art-director.ts` — rewrite `ventureBlock`, add subject-brief section, drop `hideCopy`, add literal-word guardrail helper.
- `supabase/functions/venture-social-cover/index.ts` — no logic change; verify `ctx` is passed (already is).
- `supabase/functions/venture-style-preview/index.ts` — verify same (already is).
- `src/components/hub/social/SocialAutopilot.tsx` — small logging safeguard on regenerate response.

## Out of scope

- Changing the on-image headline mechanics (already working after the last fix).
- Palette / logo compositor changes.

## Verification

After deploy, regenerate the Twitter header for "Startup Workshops" with headline "Adam Rocks!" and confirm the scene reflects a founder-education context (people at laptops, whiteboard, cohort setting) rather than a craft workshop.
