# Align typed text with the animated prompt text

## Problem

When someone starts typing in the hero prompt, their text jumps to the far left edge of the field. The animated placeholder text sits further right because the gold workshop icon occupies that space, so typing causes a visible shift and the text hugs the field edge.

## What changes

- The gold workshop icon stays visible at all times — while the animated text cycles and while the person is typing.
- Typed text begins at exactly the same horizontal position as the animated text, so nothing shifts when typing starts.
- A consistent left inset keeps both the icon and the text off the field's left edge.

## Technical notes

In `src/public.css`:

- Add a shared inset variable on `.sl-prompt__field` (e.g. `--sl-prompt-inset: 0.5em` for icon offset, plus icon width + gap).
- Give `.public-surface .sl-prompt__input` a `padding-left` equal to icon left margin + icon width + icon right margin, matching the ghost text start.
- Keep `.sl-prompt__ghost` padding aligned to the same values.

In `src/components/home/IdeaPrompt.tsx`:

- Move `<WorkshopIcon />` out of the placeholder-only block so it renders as a persistent element inside `.sl-prompt__field`, positioned absolutely at the left inset; the ghost text keeps its offset via padding rather than the icon being inline.

No copy, routing, or backend changes.
