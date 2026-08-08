# Sticky contents column + chat that fits the screen

Two fixes to the public venture showcase (`/v/...`).

## 1. Left column stays put, right column scrolls

Today the whole page scrolls as one. The contents column is tall (75 assets), so the pinned "Second brain" and "Executive summary" cards and the search box scroll out of view along with everything else, and the reader loses the navigation.

New behavior:

- The contents column becomes a full-height panel pinned to the top of the screen on desktop. It never moves while reading.
- Inside that panel, the two pinned cards and the search box stay fixed at the very top. Only the category tree below them scrolls.
- The reading pane on the right scrolls independently.
- The masthead (logo, venture name, one-liner, "Ask this venture") condenses into a slim sticky bar once the reader scrolls past it, so the contents panel gets the full screen height.
- A subtle fade at the bottom of the contents tree signals more items below.
- Mobile is unchanged: the contents open in the existing slide-over sheet.

```text
┌──────────────────────────────────────────────┐
│ slim sticky masthead                         │
├───────────────┬──────────────────────────────┤
│ Second brain  │                              │
│ Exec summary  │   asset content              │
│ [search]      │   (scrolls)                  │
│ ─ fixed ────  │                              │
│ OVERVIEW   3  │                              │
│ STRATEGY   8  │                              │
│ (scrolls)     │                              │
└───────────────┴──────────────────────────────┘
```

## 2. Chat input visible immediately

Today the Second Brain view stacks a kicker, a large serif headline, a two-line paragraph, and a tab switcher above the chat box, so the "Type your question" field sits far below the fold.

New behavior:

- The Second Brain view fills exactly the available screen height (screen minus the slim masthead), so the input sits on screen the moment the section opens.
- The heading block compresses to one line plus the Ask / Mind map tab switcher on the same row, freeing vertical space.
- The chat's message area is the only part that scrolls; the input row is anchored to the bottom of the panel at all times.
- Opening the Second Brain scrolls the reading pane to the top and focuses the input, so a reader can start typing right away.
- Starter questions stay, but as a compact row that collapses once the first message is sent.
- The mind map keeps the same fixed height so switching tabs does not shift the layout.

## 3. Full visual brand board in the shared link

Today the shared "Brand identity" section shows only logo thumbnails, a small swatch row and font names as plain text. The rest of the brand — mood board, brand DNA, voice, and the calls to action — never reaches the reader.

New behavior for the Brand identity section:

- **Logo lockups**: primary mark shown large on a light surface and again on the brand's dark surface, with the variants beneath, each labeled.
- **Color palette**: full-bleed swatch cards with role (Primary, Secondary, Accent, Text, Muted, Surface, Border), the hex value, and a click-to-copy action. Palette name shown as the heading.
- **Typography**: each font rendered in its real typeface (loaded from Google Fonts when available, graceful fallback otherwise) with a live specimen — heading in display size, body in a short paragraph — plus the family name and role.
- **Mood board**: the stored mood board images in a responsive rounded-image grid with captions, sitting directly under the palette.
- **Brand DNA and voice**: positioning line, personality traits and voice do/don't guidance rendered as readable prose rather than dumped markdown.
- **Calls to action**: the brand's approved CTA phrases surfaced as styled buttons using the real palette, so the reader sees how the brand asks for the next step. A primary CTA button also appears at the end of the section.
- Everything is read-only and public-safe; no editing controls in the shared view.

## Technical notes


- `src/routes/v.$token.tsx`: switch the body to a fixed-height two-pane layout (`h-[calc(100svh-var(--masthead))]` with `overflow-hidden` on the wrapper and `overflow-y-auto` on each pane) instead of one document scroll; add the condensed sticky masthead; scroll the reading pane (not `window`) in `goTo`.
- `src/components/share/ShareSidebar.tsx`: split into a non-scrolling head (pinned cards + search) and a `min-h-0 flex-1 overflow-y-auto` nav tree.
- `src/components/share/ShareBrain.tsx`: make the section a `flex h-full flex-col` with a compact header row, and hand the remaining height to the chat/map.
- `src/components/share/ShareChatPanel.tsx`: when embedded, use `h-full` instead of `h-[min(68vh,640px)]`, autofocus the textarea, and collapse the starter suggestions into a horizontal chip row.
- Use `100svh` so mobile browser chrome does not clip the input.
