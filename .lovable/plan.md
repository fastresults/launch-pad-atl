# Fix logo generation timeouts — split the pipeline into short, safe steps

## What's happening now

One button press runs the entire agency process inside a single edge function call:
strategy brief → 10 concepts scored down to 4 → 4 image renders → 4 vision critiques →
up to 4 retry renders → 4 uploads. That is 12–20 model calls in one request. The
platform kills any request that goes 150 seconds without sending bytes, so the run
dies mid-way and the user sees a 504 — often after the logos were already partly paid
for. Running the four renders in parallel helped, but the total still crosses the
limit whenever the critique rejects a mark and a retry fires.

The architecture is the problem, not the prompt. No amount of tuning makes a
12-call agency process fit inside one 150-second window reliably.

## The new shape: one call per unit of work

Break the process into small requests, each comfortably under a minute, and let the
UI orchestrate them. The creative quality stays exactly as designed — same strategy
pass, same scored concepting, same critique gate — it just no longer has to survive
in one connection.

```text
Step 1  "Brief"      1 request  ~20-40s   strategy + 4 scored directions  -> cached
Step 2  "Render x4"  4 requests ~40-70s   each: render 1 mark, critique, retry once
                     (fired in parallel from the browser, each independent)
```

Each render request writes its own finished logo straight into the brand kit, so a
logo appears in the UI the moment it's done instead of all four arriving at the end.
If one of the four fails, the other three are unaffected and the failed one gets a
"Try this one again" button — no more all-or-nothing runs.

## What the user sees

- Press "Generate 4 logo directions".
- A short "writing the brief" step, then four placeholder cards.
- Cards fill in one by one as each mark finishes rendering and passes review.
- Any card that fails shows a retry action; the rest are already usable.
- "More like this" keeps working — it's just a single render request.

## Quality improvements bundled in

Now that each render has its own time budget, the art direction can be stricter
rather than rushed:

- Critique gate always runs (today it's skipped when the clock is short).
- Up to two corrective retries per mark instead of one, with the reviewer's exact
  objection fed back into the retry prompt.
- Renders use the pro image model, with an automatic fall back to the fast Gemini
  image model only if the pro model errors — so a provider hiccup degrades quality
  instead of failing the logo.
- The strategy brief is cached per venture, so re-rolls and "more like this" reuse
  it instead of re-deriving it every time.

## Technical details

**Edge function `venture-brand-assets`** — split the `logo` branch into two kinds:

- `kind: "logo_brief"` — loads brand docs, builds `BrandStrategy`, runs the scored
  concepting pass, caches both in `venture_brand_kits.dna.logo_strategy` /
  `dna.logo_directions`, returns the directions. No image calls.
- `kind: "logo_render"` — takes one `direction` (plus optional `reviewNote` for a
  targeted retry), renders, critiques, retries up to twice, uploads, and appends the
  result to the kit. Returns the single logo record.

Non-logo kinds (`moodboard`, `social_*`) are unchanged.

**Hard timeouts** — wrap every gateway `fetch` (chat, vision critique, image) in an
`AbortController` with an explicit deadline (chat 45s, image 70s) so a hung upstream
call surfaces as a clean error instead of hanging until the platform kills the
request.

**Atomic append (new migration)** — four parallel renders each writing
`venture_brand_kits.logos` would clobber each other with a read-modify-write. Add a
`security definer` function `public.append_brand_logo(p_snapshot_id uuid, p_logo jsonb)`
that appends to the `logos` jsonb array in a single statement, and call it from the
render step. Grant execute to `service_role` only (edge functions).

**Client `BrandWizard.tsx`** — replace the single mutation with a two-phase flow:
call the brief, seed four pending cards in local state, then fire four `logo_render`
mutations in parallel and update each card as it resolves. Per-card error state with
a retry action. `generateBrandAsset` in `src/lib/foundersHub.functions.ts` gains the
`direction` / `reviewNote` passthrough.

**No hidden cost change** — same number of model calls in the happy path; failures
now cost less because a dead run no longer discards work already completed.
