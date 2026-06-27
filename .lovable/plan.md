# "Fill test concept (dev)" — what it is and what happened

## What this button does

It's a developer-only shortcut that lives at the bottom of `/dashboard/hub/new` Step 1. Its only purpose is to save you typing while testing the New Venture flow:

1. You pick a Track (Tech / SaaS, E-commerce, Main Street, etc.).
2. The button picks a real seed homepage URL for that track (e.g. Glossier for DTC, Bellina Bakery for Main Street).
3. It calls the `dev-reverse-engineer-concept` edge function, which scrapes that URL with Firecrawl and asks the AI to reverse-engineer a plausible business concept, company name, city/region/industry.
4. It pre-fills the founder + company fields on the form so you can hit "Create & enrich" immediately.

It is gated behind `import.meta.env.DEV`, so it only appears in the local/preview dev build — it does **not** ship to production.

## What happened

Two errors fired in sequence today:

1. **`URL not on allowlist`** — the seed for the selected track wasn't in the edge function's allowlist. Fixed by adding Bellina Bakery, Detail Garage, Glossier, and F45.
2. **`Firecrawl returned no markdown`** — Firecrawl scraped the page but returned an empty markdown body (common for JS-heavy or bot-protected homepages). Fixed by retrying with `waitFor: 2500`, requesting `markdown + html + summary`, turning off `onlyMainContent`, and falling back to stripped HTML if markdown is still empty.

So the button itself isn't broken — it's a dev convenience that has been failing because the seed sites it points at don't always cooperate with a single Firecrawl pass.

## Options for what to do next

Pick one:

- **A. Leave as-is.** It's already dev-only and the two recent fixes should make it work for the current seed set. No further work.
- **B. Harden it.** Add: (i) automatic fallback to a different seed in the same track if the first one returns nothing, (ii) clearer toast messages naming the seed that failed, (iii) a small dev-only seed picker so you can choose which site to scrape instead of it being random.
- **C. Remove it.** Delete the button + the `dev-reverse-engineer-concept` function entirely. Cleanest, but you lose the one-click test path for QA.
- **D. Hide it for everyone except admins in production.** Replace the `import.meta.env.DEV` gate with an `is_admin` check so you can use it on the live site too.

## Recommendation

Go with **B (Harden it)**. Concretely:

1. In `hub.new.tsx`, on a Firecrawl/empty-response error, automatically retry once with the next seed for that track before surfacing the toast.
2. Surface the seed URL in the error toast so it's obvious which site failed.
3. Add a tiny dev-only `<select>` next to the button listing the seeds for the active track, defaulting to "Random".

No production code paths or user-facing UI change.
