# Second Brain on the shared link: auto-alternating tabs + brain-grade formatting

Two changes to the public showcase's Second Brain panel, matching the screenshot.

## 1. Tabs alternate every 4 seconds

- When both "Ask anything" and "Mind map" are available, the panel auto-switches between them every 4 seconds so a visitor sees both tools exist.
- A thin progress line under the active pill shows the cycle, so the switch feels intentional rather than glitchy.
- Cycling stops permanently on the first sign of intent: tapping a tab, clicking/typing in the chat box, sending a question, starting voice input, or touching/dragging the mind map. Once stopped, it never restarts for that visit.
- It never starts at all when: only one tab is enabled, a question was handed over from a timeline step, the visitor has reduced-motion enabled, or the panel is off-screen.
- On the mobile full-screen sheet the same rule applies, and it stops the moment the keyboard opens.

## 2. Share brain adopts the venture brain's formatting

Today the public panel is a lighter, one-off chat. It gets re-skinned to the same look and rhythm as the internal Second Brain page:

- Bordered panel with a header row (brain icon, "Second Brain" title, subtitle) and the tab switcher on the right — the layout shown in the screenshot.
- Empty state: a lead line plus a row of tappable starter question chips written for a visitor ("What is this business?", "What's the offer and pricing?", "What's already built?", "What happens in the first 30 days?").
- Message rows styled like the internal brain: right-aligned filled user bubble, assistant answers rendered as prose on the surface with no bubble, same spacing and type scale.
- Composer identical to the internal one: rounded input frame that focuses on hover, auto-growing textarea, mic button, square send button, and a thinking row with a spinner while an answer streams in.
- Owner-only affordances from the internal brain (rebuild memory, notes, reset, save-as-note, viewing-as banner) are deliberately not carried over to the public page.

## Technical notes

- `src/components/share/ShareBrain.tsx`: add an interval-driven tab rotation with an `interacted` ref that cancels it; pause via `IntersectionObserver`; respect `prefers-reduced-motion`; add the header/progress affordance.
- `src/components/share/ShareChatPanel.tsx`: restyle the embedded variant to mirror the chat block in `src/routes/_authenticated/dashboard/brain.tsx` (lines ~536-710) — shared bubble/composer markup extracted into a small `src/components/brain/chat-bits.tsx` so both surfaces stay in sync.
- Interaction signals bubble up from `ShareChatPanel` and `ShareMindMap` via an `onInteract` callback.
- No backend, payload, or edge-function changes — presentation only. Desktop and mobile share layouts both consume the same component.
