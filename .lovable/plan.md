## What the logs and screenshot show

- The attached viewer is correctly detecting that the Website PRD builder prompt is incomplete, but the UX only warns the user and leaves them with a short/legacy prompt preview.
- Recent AI Gateway logs do not show a fresh Website PRD regeneration in the latest visible calls; the inspected calls were Founder Roadmap (`log_id 019f0be5-49ce-7dea-904b-3db656316736`, 2026-06-28T01:43:55Z, Flash, ~5,118 output tokens) and Budget & Pro Forma (`log_id 019f0be1-0b54-7b35-9d9f-f87fa73f9130`, 2026-06-28T01:39:52Z, Pro, ~9,390 output tokens). So the screenshot appears to be showing an older/incomplete PRD document that has not been repaired.
- Code review found a second generation path still not aligned: `venture-generate-document` has the newer Pro + `max_tokens` logic, but `venture-bulk-generate` still uses the default document tier and does not set `max_tokens`, so Website PRDs generated through bulk/run-remaining can still be shorter or lower-quality than the single-doc path.

## Plan

1. **Make Website PRD generation consistent in every path**
   - Update `venture-bulk-generate` so `website_prd` is force-routed to the Pro model, same as single-document generation.
   - Add high `max_tokens` for `website_prd` in bulk generation.
   - Add `finish_reason` / truncation detection in bulk generation and mark incomplete output with `<!-- TRUNCATED -->`, matching the single-document path.

2. **Add a one-click repair action inside the PRD viewer**
   - When the viewer detects an incomplete Website PRD builder prompt, replace the passive warning-only state with a prominent action: **Regenerate full Website PRD**.
   - The action will call the existing document generation flow for `website_prd`, then refresh the viewer when complete.
   - Keep the warning, but make it actionable so the user does not have to hunt through the Hub.

3. **Prevent copying a known-bad prompt without context**
   - If the builder prompt is incomplete, change the copy behavior to warn the user before copying or require regeneration first.
   - The goal is that users do not unknowingly paste a partial prompt into Lovable/v0/Bolt/Cursor.

4. **Tighten prompt extraction and validation**
   - Treat a builder prompt as complete only if it contains all required numbered sections `1)` through `11)` and the closing instruction.
   - If delimiters are missing, sections are missing, or the word count is below the expected threshold, the UI should label it as incomplete and show the repair CTA.

5. **Improve the preview panel so users can trust what they see**
   - Show completion metadata: word count, sections detected, and whether delimiters were found.
   - Keep the full prompt visible/expandable, but make incomplete status visually unmistakable.

6. **Validate after implementation**
   - Generate/repair a Website PRD from the viewer.
   - Confirm the AI Gateway call uses the Pro model with the larger token allowance.
   - Confirm the resulting prompt displays sections 1–11, copies fully, and no incomplete warning remains.