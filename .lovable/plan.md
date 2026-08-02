## Problem

The Atlanta snapshot modal renders as one long scrolling block: the whole dialog (header, body, invite) shares a single `overflow-y-auto` container, so there's no fixed frame, no scroll affordance, and the workshop invitation only exists at the very bottom — most visitors never reach it. The AI also returns a lot of prose up top (3 paragraphs before any structure), which pushes the offer further down.

## What to change

### 1. Modal shell: fixed frame, one scroll region

Rebuild `src/components/home/IdeaSnapshotModal.tsx` as three stacked areas inside a height-capped flex column:

```text
┌─ header (fixed) ────────────────┐  Metro Atlanta read · idea label · close
├─ body (the only scroller) ──────┤  verdict → why → signals → first moves → watch-outs
│                                 │  (top/bottom fade masks signal more content)
└─ footer (sticky, always shown) ─┘  Aug 20 · $197 · [Reserve my seat →]
```

- `DialogContent` becomes `flex max-h-[86vh] flex-col overflow-hidden`; only the middle `<div>` gets `overflow-y-auto overscroll-contain`.
- Header stays visible while scrolling and carries the idea label so context never scrolls away.
- Footer is a sticky action bar with the primary CTA — visible from the first paint, including while the snapshot is still loading (disabled/soft state until content lands).
- Add subtle top/bottom gradient fade on the scroll area so it reads as scrollable.
- Mobile: full-width sheet, `max-h-[92vh]`, footer CTA full-width and thumb-reachable.

### 2. A real invitation, not a footnote

- **Sticky bar (always visible):** "Thursday, Aug 20 · IGNITE Center · $197" + **Reserve my seat →**.
- **Inline invite card (end of scroll):** keeps the fuller pitch but rewritten so it lands as the natural conclusion of the read — name the three artifacts they walk out with (live page, priced offer, first outreach sent), the seat scarcity, and the secondary "Ask a question first" link.
- **Mid-scroll soft prompt:** one quiet line after the signals grid — "This is the part we build with you on Aug 20." — so the offer appears before the fold twice, not once.
- CTA carries the typed idea through to `/register?idea=…` (already wired) so the registration page opens pre-filled.

### 3. Make the read scannable

- Show the verdict, then the 4 signal cards **immediately** (currently 2-3 prose paragraphs sit between them), then the prose under a "Why Atlanta" heading, then first moves and watch-outs.
- Tighten the AI prompt in `supabase/functions/atlanta-viability/index.ts`: cap `why_atlanta` at 2 paragraphs of 2 sentences, `first_moves` at 4, `watch_outs` at 3. Shorter body = the CTA is reachable in one or two scrolls.

### 4. Loading and error states in the same frame

- Skeleton renders inside the body region with the header and CTA footer already in place, so the modal never "jumps" in height when content arrives.
- Error and "tell us more" states keep the workshop footer — a failed AI read should still convert.

## Technical notes

- Files touched: `src/components/home/IdeaSnapshotModal.tsx` (restructure), `supabase/functions/atlanta-viability/index.ts` (prompt length caps only), `src/styles.css` (scroll-fade + sticky footer utility under the existing `.hero-modal` block).
- The workshop date/price stay as they are today ($197, Thursday Aug 20 2026, IGNITE Center) — no data-model change.
- Verify with Playwright at desktop and mobile widths: CTA visible without scrolling, body scrolls independently, header/footer pinned, loading and error states keep the CTA.
