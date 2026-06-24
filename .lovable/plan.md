# Add test-fill button to `/dashboard/hub/new`

Temporary helper to speed up manual testing. Easy to rip out later.

## Changes

**`src/routes/_authenticated/dashboard/hub.new.tsx`**

1. Add a `SAMPLE_CONCEPTS` array (~6 entries) of comprehensive, realistic business concepts spanning different industries (B2B SaaS, consumer marketplace, fintech, climate, healthtech, devtools). Each ~3–5 sentences covering what it does, who it's for, and why it matters.
2. Add a small `Fill test concept` button near the Business concept textarea label (right-aligned, `variant="ghost"` `size="sm"`, `Beaker`/`Wand2` icon, muted styling so it reads as dev-only).
3. On click: pick a random entry from `SAMPLE_CONCEPTS` and set it as the textarea value (replaces current content). If `path === "competitor"`, also fill the Differentiation field with a matching short blurb.
4. Wrap the button in a `// TODO: remove after testing` comment block so it's trivial to find and delete.

## Out of scope

- No edge function, no AI call (purely static samples — instant, no credits).
- No changes to dropzone, voice recorder, schema, or submit flow.
- No feature flag / env gating — user explicitly wants it visible now and will remove later.
