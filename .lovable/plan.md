## Plan: Depersonalize the method name to "The 14-Day Pivot Method"

### Goal
Replace all references to **Adam Anderson's Startup Process**, **Anderson's Process**, **Anderson Method**, and **Melange Method** with **The 14-Day Pivot Method**. Keep **The 14-Day Launch Method** as the offer name. Reduce but do not erase Adam Anderson as the named facilitator.

### Scope

#### 1. Route pages (marketing copy)
- `src/routes/build.tsx` — replace "Anderson's Process" headline reference.
- `src/routes/one-on-one.tsx` — replace "Anderson's Process" in the hero subheading.
- `src/routes/webinar.tsx` — replace "Adam Anderson's Startup Process" in the body copy; keep page title referencing Adam Anderson as facilitator.
- `src/routes/services.tsx` — no method-name changes; Adam Anderson name/alt text stays as facilitator identity.

#### 2. Home page
- `src/components/home/HomeFramework.tsx` — replace "Adam Anderson's Startup Process" with "The 14-Day Pivot Method" in the framework description. Keep Adam Anderson name/photo as facilitator identity.

#### 3. Chatbot knowledge base
- `src/lib/chatbot-knowledge.ts` — update the brand vocabulary section: remove "Adam Anderson's Startup Process" as an authority handle, add "The 14-Day Pivot Method" as the process name, and keep "The 14-Day Launch Method" as the offer name.
- Update any inline references so the bot no longer instructs itself to use the Adam-branded process name.

#### 4. Dashboard / registration copy
- `src/lib/hub-dashboard-copy.ts` — replace "Anderson's proven 14-day sprint" with a depersonalized reference to The 14-Day Pivot Method.
- `src/components/register/RegisterFramework.tsx` — reduce frequency of "Adam Anderson" where it appears twice in close proximity; keep one identity reference.
- `src/lib/cohorts.ts` — keep workshop description factual; optionally reduce "Adam Anderson" to "the facilitator" if the sentence becomes overloaded with name references.

#### 5. Public static assets
- `public/business-case.txt`, `public/business-case.md`, `public/business-case.html` — update any references to the method/process name if present. These files primarily describe Adam's background, so facilitator identity references remain.

#### 6. Global verification
- Run a search for "Adam Anderson's Startup Process", "Anderson's Process", "Anderson Method", and "Melange Method" to confirm zero remaining occurrences in `src/`.
- Run `tsgo` typecheck to ensure no TypeScript errors from the copy changes.

### Out of scope
- Removing Adam Anderson entirely as a facilitator (he remains the named operator in the room).
- Changing "The 14-Day Launch Method" offer name.
- Renaming URLs or route paths.

### Acceptance criteria
- All method/process references point to **The 14-Day Pivot Method**.
- The offer is still marketed as **The 14-Day Launch Method**.
- No remaining occurrences of "Adam Anderson's Startup Process", "Anderson's Process", "Anderson Method", or "Melange Method" in `src/`.
- Typecheck passes.