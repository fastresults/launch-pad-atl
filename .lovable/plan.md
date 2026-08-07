# Share showcase: complete visuals, clean formatting, and a venture chat

Four fixes to the public `/v/<token>` showcase.

## 1. Remove "Your AI toolkit, picked for you"

The `ai_tool_stack_recommendation` asset is internal tooling advice, not something to show a
reader. It gets filtered out of the public payload permanently (a hard exclude list in the share
function), so it never returns in future shares. Nothing changes in the hub — founders still see
it there.

## 2. Every section gets its header graphic, and all produced artwork shows up

Current state (verified): of 63 completed assets on the venture being shared, only 20 have a
header image stored; brand collateral (30 pieces) and social assets (7) do exist in storage.

Work:
- Audit and repair the share payload so brand collateral, social profile kit, campaign creative
  by week, logo, and palette all appear as galleries — including a check that every signed image
  URL actually resolves (a failed signature currently drops the image silently instead of
  reporting it).
- Add a brand board section: primary logo, logo variants, full colour palette swatches with hex
  values, and typography specimens rendered from the brand kit.
- Where an asset has header art, show it at the top of the section, full-bleed, rounded.
- Where an asset has no header art, render a branded cover plate (venture colours + serif title)
  instead of a bare heading, so no section looks empty.
- Add a one-click "Generate missing header art" action in the hub's share dialog that backfills
  header images for the assets missing them, so shares can be fully illustrated before sending.
- Inline images embedded inside generated markdown keep working and stay rounded.

## 3. Markdown that renders as markdown

Some assets (the call-summary framework in the screenshot) arrive wrapped in a code fence or
carry raw markup, so the reader sees monospace `##` and `**` instead of formatted text.

Work in the shared normalizer used by both the share view and the hub viewer:
- Unwrap fences whose contents are plainly prose/markdown (headings, bullets, bold) rather than
  code; keep real code (JSON, shell, HTML) fenced.
- Render `# filename.md` first lines as a section label rather than an H1.
- Preserve `{{PLACEHOLDER}}` tokens but style them as inline chips so they read as fill-ins.
- Keep emoji section markers, but let the heading style come through.
- Then re-run the full-asset audit at desktop and mobile widths to confirm no raw markup and no
  horizontal overflow remain.

## 4. Ask-anything chat on the shared link (type or speak)

A docked chat panel on the showcase, available on every section, so a reader (investor, partner,
family member) can interrogate the venture without an account.

- New public, token-scoped endpoint that answers only from that venture's own assets — the same
  retrieval approach as the founder's Second Brain, but scoped to the shared snapshot and to the
  sections included in the link. No account, no access to anything outside the share.
- Voice input: hold-to-talk records audio, transcribes it, and drops the text into the composer;
  the reader can edit before sending.
- Answers cite the asset they came from, and the citation jumps the reading pane to that section.
- Rate limited per link and per IP, disabled automatically for password-protected links until the
  password is entered, and revoked/expired links get no chat access.
- Owner can toggle chat off per share link from the hub.

## Technical notes

- `supabase/functions/venture-share/index.ts`: hard-exclude `ai_tool_stack_recommendation`;
  add brand board item (logo variants, palette, type) from `venture_brand_kits`; log and count
  failed `createSignedUrl` calls; return a `chatEnabled` flag.
- New `supabase/functions/venture-share-chat/index.ts`: verifies token/password/expiry, builds
  context from that snapshot's `venture_documents` + brand kit, calls the AI gateway with
  streaming, returns answer + citation keys. Anonymous (no JWT), IP + token rate limit.
- `src/lib/markdown-normalize.ts`: prose-fence unwrapping, filename-header handling, placeholder
  chips. `MarkdownProse` gains the chip style.
- `src/components/share/ShareSection.tsx`: cover-plate fallback, brand board layout.
- New `src/components/share/ShareChat.tsx` (docked panel) reusing the existing recording +
  transcription path; new `src/lib/share-chat.functions.ts`.
- `venture_shares` gets a `chat_enabled` boolean (default true) with the usual grants/RLS.
- Hub: share dialog gains chat toggle and "generate missing header art".
