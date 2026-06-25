## Make "🧪 Fill test concept" track-aware

Today the button picks a random URL from a SaaS-only seed list (Linear, Vercel, Supabase…) and hardcodes Atlanta / national / a SaaS-style concept. That's wrong for a Lifestyle / Main Street or Deep Tech founder testing the flow.

New flow: **the selected Track drives everything the button does** — which seed company it pulls, what defaults it fills, and the tone of the reverse-engineered concept blurb.

### 1. Require a Track first

- If no Track is selected when the user clicks the button, don't scrape. Show a toast: *"Pick a Track first — it shapes the test concept and research."* and scroll the Track picker into view + add a brief ring-pulse to it.
- Button stays enabled (cheap UX), but the click short-circuits with the toast.

### 2. Per-track seed catalog

Replace `SEED_URLS` with a `TRACK_SEEDS: Record<TrackKey, SeedEntry[]>` map in `src/lib/tracks.ts` (kept next to track defs so both client and the edge function read the same source — edge function mirrors as a const, same pattern as `TRACK_TONE`).

Each `SeedEntry` carries enough to fill the form realistically:

```ts
type SeedEntry = {
  url: string;
  industry: string;       // matches IndustryCombobox values
  sub_industry?: string;
  market_scope: "local" | "regional" | "national" | "international";
  city?: string; region?: string; country?: string;
};
```

Initial catalog (3–4 per track, all real, public homepages):

- **lifestyle** — `https://bluebottlecoffee.com` (specialty café, Oakland CA, local), `https://www.equinox.com` (gym, NYC, regional), a local salon site, a freelance consultant landing page.
- **small_business** — `https://www.aceshardware.com` (retail), `https://www.servprofranchise.com` (franchise), a regional law firm, a regional HVAC company.
- **scalable_tech** — keep current set (Linear, Vercel, Resend, Cal, PostHog, Supabase, Cursor, Notion, Attio…). National/international, San Francisco.
- **marketplace** — `https://www.etsy.com`, `https://www.airbnb.com`, `https://www.upwork.com`, `https://www.faire.com`.
- **deep_tech** — `https://www.boomsupersonic.com`, `https://www.ginkgobioworks.com`, `https://www.anthropic.com`, `https://www.commonwealthfusion.com`.
- **social_impact** — `https://www.warbyparker.com` (B-corp), `https://www.toms.com`, `https://www.kiva.org`, `https://www.charitywater.org`.
- **corporate** — `https://www.palantir.com`, `https://www.anduril.com`, `https://www.govtech.com`, `https://www.boozallen.com`.

(Edge-function allowlist is the union of all of these.)

### 3. Button click logic (track-driven)

```text
1. If !track → toast + scroll-to + return.
2. seed = randomFrom(TRACK_SEEDS[track])
3. Call dev-reverse-engineer-concept with { url: seed.url, track }
4. On response:
   - setCompanyName / setWebsiteUrl / setBusinessConcept / setDiff (as today)
   - From the seed (not hardcoded): setIndustry, setSubIndustry (only when blank),
     setMarketScope, setCity/Region/Country (only when blank)
   - Drop the call to guessIndustry — seed already knows it
   - Keep the founder name/email/phone fallback logic as-is
5. Toast: "Filled with a {track.label} test — {company}"
```

### 4. Edge function (`dev-reverse-engineer-concept`)

- Expand `ALLOWED_URLS` to the union of all track seeds.
- Accept `track?: string` in the request body; validate against the 7 keys.
- Inject a one-line track lens into the system prompt so the reverse-engineered concept blurb sounds like that track would write it:
  - Lifestyle → "Write as a sole-founder lifestyle business — plain, local, no jargon."
  - Scalable Tech → "Write as a venture-track SaaS founder — ICP and defensibility framing."
  - …mirroring the `TRACK_TONE` map already in the function (this lens is shorter; just enough to shape the test blurb).
- Return shape unchanged (`company`, `url`, `concept`, `diff`) — client doesn't need new fields, the seed entry is the source of truth for industry/location.

### 5. Out of scope

- No DB changes.
- Not auto-selecting a Track from the URL — Track stays an explicit founder decision.
- No new UI surface beyond the toast + scroll behavior; the button label stays "🧪 Fill test concept".
- Real deep-research / market scope tuning is already handled by the previous tracks plan in `venture-deep-research` — this change only affects the test-fill button.

### Files touched

- `src/lib/tracks.ts` — add `SeedEntry` + `TRACK_SEEDS`
- `src/routes/_authenticated/dashboard/hub.new.tsx` — gate on track, use `TRACK_SEEDS[track]`, apply seed defaults, scroll/ring behavior
- `supabase/functions/dev-reverse-engineer-concept/index.ts` — expanded allowlist, accept `track`, track-lens prompt
