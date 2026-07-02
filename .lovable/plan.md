## Root cause (found it)

The `…` is being injected **client-side**, not by the SVG or the director. Two spots:

1. `src/components/hub/social/RegenerateAssetDialog.tsx:290`
   ```ts
   { mode: "custom", text: headlineText.trim().slice(0, 64) }
   ```
   The dialog hard-slices any custom headline to **64 chars** before sending it to the edge function. Anything longer is chopped mid-word — the trailing `…` you see was appended by the old director on the previous run and stored in `last_headline`.

2. `RegenerateAssetDialog.tsx:217`
   ```ts
   const [headlineText, setHeadlineText] = useState<string>(currentHeadline || "");
   ```
   `currentHeadline` is prefilled from `ad.last_headline` (see `ContentStudio.tsx:756` and `SocialAutopilot.tsx:661/1120`), which for existing posts still contains the old `"…"`. The user regenerates, the ellipsis is re-sent as custom text, and it's stably locked in.

Also cosmetic: line 399 shows `${headlineText.length}/64`, and line 423 preview does `.slice(0, 64)` on the suggestion.

Neither the director nor the SVG can fix this — by the time they receive the payload, the string already ends in `…` and is ≤64 chars.

## Fix plan

### 1. `src/components/hub/social/RegenerateAssetDialog.tsx`

- Raise the custom-headline cap to **140 chars** (matches new director cap of 100/110/120 with headroom). Update:
  - `slice(0, 64)` on submit → `slice(0, 140)`
  - `/64` counter → `/140`
  - Preview line 423 `.slice(0, 64)` → `.slice(0, 140)`
- Sanitize `currentHeadline` prefill: strip trailing `…`, `...`, and any trailing punctuation/whitespace left over from the old truncator. New helper `sanitizeHeadline(s)` used at both `useState` init and the "Use suggested" fallback.
- Also sanitize `suggestedHeadline` the same way before rendering the preview and using it.

### 2. `src/components/hub/ContentStudio.tsx` and `src/components/hub/social/SocialAutopilot.tsx`

- When passing `currentHeadline` into the dialog, prefer the **source hook** over the stored `last_headline` when the stored value is a truncated prefix of the hook (endsWith `…` or `...`, or shorter than hook and matches its prefix). Fall back to `last_headline` only when the hook is missing.
- `ContentStudio.tsx:756` already has `post.hook` as fallback — flip the priority so hook wins when last_headline looks truncated.
- `SocialAutopilot.tsx:661` and `1120` don't currently pass the hook — add it.

### 3. Backfill safety in the edge function

- In `venture-content-ad/index.ts` around line 240, after parsing `headlineOverride`, strip trailing `…`/`...` from `rawHl.text` so any old client that still sends a truncated string self-heals.

### 4. Verification

Regenerate the failing "market gap" post — the Headline field should show the full hook without `…`, and the rendered image should wrap to 3 lines with no ellipsis. Test a short (~20 char), medium (~60 char), and long (~110 char) headline. Confirm tier-fit from the previous fix engages and no truncation appears at any length.

## Files touched

- `src/components/hub/social/RegenerateAssetDialog.tsx`
- `src/components/hub/ContentStudio.tsx`
- `src/components/hub/social/SocialAutopilot.tsx`
- `supabase/functions/venture-content-ad/index.ts` (redeploy)
