## Problem

In Step "Generating your channel kits", each tile shows only a thumbnail + a truncated platform name (e.g. `I`, `A..`, `F`) next to the action buttons. Users can't tell which channel (Instagram, LinkedIn, X, Facebook, YouTube, TikTok…) or which asset type (Avatar vs Cover) a graphic belongs to. The row is dominated by Preview/Download/Keep/Regenerate/Trash, and the label column collapses.

## Fix (UI only — `src/components/hub/social/SocialAutopilot.tsx`, Step 5 tile list ~lines 921–1040)

1. **Group tiles by channel.** Replace the flat 2-column grid with sections, one per platform. Each section has a header row:
   - Platform icon (from `PLATFORM_SPECS[t.platform].icon` if present, else a lucide fallback map: Instagram/Linkedin/Twitter/Facebook/Youtube/Music2 for TikTok).
   - Platform display name in `text-sm font-semibold` (use `PLATFORM_SPECS[p].label ?? p`).
   - Small count pill: "Avatar + Cover" or "2 assets".
2. **Make asset type unmistakable on every tile.** Above the thumbnail row, render a badge:
   - `Avatar` (pill, neutral) for `t.asset === "avatar"`.
   - `Cover` / humanized `t.asset` (e.g. "Pinned Post", "Story", "Header") for the rest, via a small `assetLabel(kind)` helper.
   - Keep the circle vs rectangle frame shape as today, but also enlarge thumbs slightly (`h-20 w-20` avatar, `h-20 w-36` cover) so the shape reads at a glance.
3. **Fix the truncated middle column.** Remove `truncate` on the platform name row inside the tile (the section header already carries the channel). Replace the inner `<span>{t.platform}</span>` with the asset-type label + dimensions (e.g. "Cover · 1500×500"), pulled from `PLATFORM_SPECS[t.platform].assets[t.asset]` when available. This keeps the row informative without the tiny "I / A.." clipping seen in the screenshot.
4. **Responsive layout.** Section grid = `sm:grid-cols-2`; tiles inside a section stack `flex-col sm:flex-row` so action buttons wrap under the label on narrow widths instead of pushing the label off-screen.
5. **Accessibility.** Update `alt` and `title` to `"${platformLabel} — ${assetLabel}"` so screen readers and hover tooltips match the new visible labels.

## Out of scope
- No changes to generation, regenerate, keep, delete, preview modal, or edge functions.
- No data-model changes; all labels derive from existing `PLATFORM_SPECS` + task fields.

## Files touched
- `src/components/hub/social/SocialAutopilot.tsx` (Step5 kit list + a small `assetLabel`/`platformIcon` helper)

Approve and I'll implement.