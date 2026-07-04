# Make the concierge aware of /services (Launch/Growth/Operate Tracks + agency services)

The public chatbot doesn't know terms like "Launch Track" because the knowledge corpus only covers the workshop + BUILD_LAYER capability list. It never mentions the three done-for-you Tracks or the per-service scope on `/services`.

## Fix

1. **`src/lib/chatbot-knowledge.ts`** — import `AGENCY_TRACKS` and `AGENCY_SERVICES` from `@/lib/agency-services` and render two new sections into `CONCIERGE_KNOWLEDGE`:

   - **`## Done-for-you Tracks (/services)`** — for each track: name, tagline, outcome, what's included (mapped from `includedSlugs` to capability names), price label, timeline label, CTA route. Explicitly list "Launch Track", "Growth Track", "Operate Track" so the model matches on those exact names.
   - **`## Individual done-for-you services`** — for each of the 8 services: capability name, one-liner, deliverables bullets, price label, timeline, workshop route (`/build/<slug>`), contact route.
   - Add a short intro line clarifying: workshop = strategic foundation; Tracks/services = done-for-you build after (or independent of) the workshop.

2. **Canned Q&A additions** in the same file (append to "Common questions"):
   - "What's the Launch Track / Growth Track / Operate Track?" → one-line each, point to `/services`.
   - "How much does the done-for-you build cost?" → tracks are bespoke after a 20-min discovery call; individual services have `From $X` starting prices on `/services`.
   - "Do I have to do the workshop first?" → no, Tracks/services stand alone; workshop is recommended for founders who don't yet have strategic clarity.

3. **`supabase/functions/venture-chatbot/knowledge.ts`** — regenerate from the updated `CONCIERGE_KNOWLEDGE` (same script used last time: render via tsx, escape backticks/`${`, write as template literal).

4. **Deploy** `venture-chatbot` edge function so the new corpus ships.

5. **Minor system-prompt tweak** in `supabase/functions/venture-chatbot/index.ts` — add Tracks, agency services, and `/services` to the "answer questions about…" sentence so the model treats them as in-scope rather than deflecting.

## Verification

- Ask the deployed chatbot "what is the Launch Track?" and "what does the Launch Track include beyond the foundation workshop?" — expect answers referencing brand identity, website that converts, and legal/financial/operational scaffolding, and pointing to `/services`.

No UI changes. No schema changes. One source-of-truth file (`chatbot-knowledge.ts`) drives both the site copy and the edge function corpus.
