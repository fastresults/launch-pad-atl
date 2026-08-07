# Make poster headlines actually read like headlines

## Why the last fix didn't solve it

The clipping fix was real, but it treated a symptom. The headline on a poster is never *written* — it's the calendar post's `hook` sentence, mechanically shortened.

Confirmed in the code:

- `resolveAdHeadline()` returns `{ mode: "custom", text: truncateHeadline(post.hook, cap) }` whenever the post has a hook — which is always.
- `buildPosterCopy()` treats a `custom` override as the founder's own words, so it **discards the AI copywriter's headline** and just clause-cuts the hook.

So the AI headline pass that exists today only ever runs when a post has no hook. Every real poster shows a truncated blog-post sentence:

```text
FAMILY CARE
Dealing with Dementia: Tips for local families navigating
```

That is an article title with the end lopped off — no promise, no tension, no reason to stop scrolling. Shortening it more just produces a shorter article title.

## What to change

**1. The hook becomes source material, not the headline.**
`resolveAdHeadline` stops promoting the hook to a `custom` override. Only a founder's explicitly typed headline (or "none") counts as an override. Everything else goes to the copywriter with the hook, body, CTA and pillar as input.

**2. Rewrite the copywriter brief around a landing message.**
The prompt asks for a headline that carries one clear idea, and enforces it structurally:

- 4–9 words, hard cap ~52 characters (today's 62–76 caps still invite sentences).
- Must land a promise, tension, or claim — not a topic. Explicitly reject "Topic: subtitle" constructions, "Tips for…", "Why X matters", and anything that reads like an article title.
- No colons unless both halves are complete thoughts, no trailing prepositions, no ellipsis, no hashtags.
- The kicker carries the topic/audience, so the headline never has to repeat it.
- Give the model 3 candidates internally and return the strongest one, plus a one-line reason (logged, not rendered).

**3. Judge the headline, then retry once.**
A cheap validator rejects: over the character cap, more than 9 words, article-title patterns, topic-only phrasing (no verb), or a headline that merely repeats the kicker. One rewrite attempt with the specific rejection reason, then fall back to a clause-cut hook only if both attempts fail — and flag `headline_source: "fallback"` in QA so it's visible rather than silent.

**4. Fit follows copy.**
With a ~52-character headline the display type gets larger and settles at 2 lines instead of 3–4, which is also what fixes the cramped look in the samples. Keep the existing width-safe wrapping and the refit retry as a backstop, and keep the kicker legible by holding it to the measured-contrast ink rule already in the compositor.

**5. Founder control stays.**
Typed custom headlines are still used verbatim (only length-guarded), and "no headline" still suppresses type.

## Technical notes

- `supabase/functions/_shared/content-ad-director.ts` — `resolveAdHeadline` no longer wraps the hook as a custom override; returns `{ mode: "auto" }` so the copy pass owns the line. Drop `HEADLINE_CAP` to ~52 for 1:1 and ~56 for 4:5 / 9:16.
- `supabase/functions/_shared/poster-copy.ts` — new system prompt (candidates + selection), new `headlineIssue()` checks (word count, article-title regexes, verbless topic phrase, kicker echo), one targeted retry, `headline_source` on `PosterCopy`.
- `supabase/functions/venture-content-ad/index.ts` — pass the raw hook/body as source instead of an override; record `headline_source` and the rejection reason in `qa_notes`.
- `src/components/hub/social/AssetPreviewDialog.tsx` — show headline source (written / founder / fallback) next to the existing fit and contrast readouts.

No schema changes. Regenerating an existing ad picks up the new copy automatically.
