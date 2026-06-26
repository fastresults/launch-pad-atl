# Why the brief doesn't persist

The "Tell us about you" screen is rendered by `src/components/brief/FounderBlock.tsx`. It loads the saved row with:

```ts
const { data } = useQuery({ queryFn: () => getFounderProfile() });
const profile = data?.profile ?? null;          // ← BUG
```

But `getFounderProfile()` in `src/lib/discovery.functions.ts` already returns the row itself (not wrapped in `{ profile }`):

```ts
const { data } = await supabase.from("attendee_founder_profile")... .maybeSingle();
return data ?? {};
```

So `data.profile` is always `undefined`, which is why every visit shows:
- Resume slot: "No file chosen" (we never read `source_file_path`)
- LinkedIn URL: empty
- Pasted bio: empty
- "Right person / unfair advantage" answers: empty
- The extracted block ("Did we get this right?") never appears

Additionally, `extractFounderFromText` in `discovery.functions.ts` is a stub that returns `{}` — so even when the user clicks "Read my resume" / "Extract", nothing is written to `extracted`, and on the next visit there is nothing to show. The Edge Function that actually does the extraction is never invoked.

Lastly, `useQuery` only seeds local state on first render. When the row finally arrives, `useState` initializers have already run with the empty defaults, so the form stays blank even after data loads.

# Fix

### 1. `src/lib/discovery.functions.ts`
- Change `getFounderProfile()` to return `{ profile: data ?? null }` so the existing consumers continue to work, OR (simpler) read the row directly in the component. Pick the first option — `summarizeFounderProfile()` already calls `row?.extracted`, so we keep that working by reading from `row.profile` in the new shape, or by adding a second helper `getFounderProfileRow()`. Cleanest: return `{ profile }` and update `summarizeFounderProfile` accordingly.
- Replace the stubbed `extractFounderFromText` with a real call to the existing Edge Function (the project already has resume/LinkedIn extraction wired through `brief-prefill` / `venture-synthesize-concept`). Invoke the function with `{ raw_text, linkedin_url, source, source_file_path }`, persist the returned `extracted` JSON into `attendee_founder_profile.extracted`, and return `{ note? }`.

### 2. `src/components/brief/FounderBlock.tsx`
- Hydrate local state from `data` once it arrives. Use a `useEffect` that runs when `data` changes to populate `linkedinUrl`, `rawText`, `filePath`, `filename`, `rightPerson`, `edge` from the loaded profile (only when the field is still empty, so it doesn't clobber in-progress edits).
- Derive `filename` from the stored `source_file_path` (take the basename after the last `/` and strip the timestamp prefix) so the "✓ Uploaded" line shows on return visits.
- Keep the existing `data?.profile` access by aligning with the new helper shape.

### 3. Persistence on extract
- After `extractFn` succeeds, also persist `linkedin_url`, `raw_text`, and `source_file_path` to the row (currently only `extracted` is saved server-side; the typed text and LinkedIn URL are never written, which is the other reason returning users see empty fields). Do this in `extractFounderFromText` so a single call covers it.

### 4. Verify
- Reload `/dashboard/brief?review=1` after upload + extract: file name, LinkedIn URL, pasted text, and the green "Did we get this right?" panel should all render from the saved row.
- `summarizeFounderProfile()` should still produce a non-empty summary (uses `row.extracted`).

# Out of scope
- No UI redesign, no schema changes — `attendee_founder_profile` already has `linkedin_url`, `raw_text`, `source_file_path`, `extracted`, `right_person_reason`, `unfair_advantage` columns.
