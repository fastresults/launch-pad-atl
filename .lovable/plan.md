## Add Tracks to the Startup Workflow

Founders pick a **Track** when creating a startup. The track is persisted on the snapshot and injected into every AI prompt (deep research + document generation) as a tone/lens directive, so a Lifestyle / Main Street venture doesn't get the same VC-flavored copy as a Deep Tech one.

### The 7 tracks

| Key | Label | One-liner |
|---|---|---|
| `lifestyle` | Lifestyle / Main Street | Revenue over scale — local services, solo founders |
| `small_business` | Small Business / Traditional | Profit & longevity — shops, agencies, trades |
| `scalable_tech` | Scalable Tech / SaaS | Exponential growth, low marginal cost — VC target |
| `marketplace` | Marketplace / Platform | Multi-sided, network-effects driven |
| `deep_tech` | Deep Tech / Frontier | High R&D, breakthrough-dependent |
| `social_impact` | Social Enterprise / Impact | Mission-built into the model |
| `corporate` | Corporate / Institutional | Spinouts, intrapreneurial, gov-tech |

### UX

**Hub create flow (`hub.new.tsx`)** — add a new "Track" block above Industry, in the founder/market context section.

- Renders as a 2-column grid of 7 selectable cards (radio behavior). Each card: label, one-liner, subtle icon. Selected = accent border + ring.
- "What's this?" inline helper expands a short paragraph explaining tracks influence tone, not feature set.
- Required to submit (added to `founderReady`).
- Default: none selected (forces an explicit choice — this is the whole point).

**Hub library (`hub.index.tsx`)** — show a small Track chip on each `SnapshotCard` (under company name) so founders can tell them apart at a glance. No filtering by track in this pass.

**Snapshot detail (`hub.$snapshotId.tsx`)** — Track chip in the header next to industry. Editable via existing "edit founder context" affordance.

### Data

One migration:

```sql
ALTER TABLE public.venture_snapshots
  ADD COLUMN track text
  CHECK (track IN (
    'lifestyle','small_business','scalable_tech','marketplace',
    'deep_tech','social_impact','corporate'
  ));
```

Nullable so existing snapshots stay valid; new ones require it at the app layer.

### Backend wiring

- **`src/lib/foundersHub.functions.ts`**
  - Add `track` to `VentureSnapshot` type.
  - Accept `track` in `createSnapshot` and `updateFounderContext`.

- **`src/lib/tracks.ts`** (new) — single source of truth: `TRACKS` array (`key`, `label`, `oneLiner`, `tonePrompt`) consumed by UI and edge functions can mirror via inline copy. The `tonePrompt` is a ~3-sentence directive, e.g.:
  - Lifestyle: "Write as a pragmatic operator coaching a sole founder. Optimize for cash flow, simplicity, and local credibility. Avoid VC jargon, TAM/SAM/SOM framing, and growth-at-all-costs language."
  - Scalable Tech: "Write as an early-stage tech operator. Lean into product-led growth, defensibility, unit economics at scale, and venture-readiness."
  - …etc per track.

- **`supabase/functions/venture-generate-document/index.ts`** — include the track's `tonePrompt` block in `systemPrompt` (appended after `baseSystem`), and add `track` to `founderCard`. Same constants duplicated in the function (no shared import across edge boundary).

- **`supabase/functions/venture-deep-research/index.ts`** — pass track tone into the market-research Perplexity prompt and customer-voice prompt so research framing matches (e.g. local foot traffic vs. ICP/PMF signals).

### Out of scope

- No filtering, grouping, or analytics by track yet.
- No per-document-type overrides — track tone applies uniformly.
- No retro-classifying old snapshots; they keep `track = null` and use the existing generic tone.

### Files touched

- New migration adding `track` column
- New `src/lib/tracks.ts`
- `src/lib/foundersHub.functions.ts`
- `src/routes/_authenticated/dashboard/hub.new.tsx`
- `src/routes/_authenticated/dashboard/hub.index.tsx`
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`
- `supabase/functions/venture-generate-document/index.ts`
- `supabase/functions/venture-deep-research/index.ts`
