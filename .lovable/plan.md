## Goal

Restyle `src/components/site/AskConcierge.tsx` so the launcher, panel, header, message bubbles, composer, and starter chips match the site's warm-sand editorial redesign (cream `#FAF8F5`, tan `#F0EBE3`, espresso `#8B7355`, DM Serif Display + Fira Sans, square-ish corners). No behavior changes — voice, transcription, storage, and edge-function calls stay identical.

## What's off today

Screenshot shows:
- Purple/blue **gradient header** (`bg-hero-gradient` reads as brand purple against espresso elsewhere) — inconsistent with cream/espresso.
- **Solid black panel body** (`bg-background` is dark) and dark composer — the rest of the marketing site is cream.
- **Bright purple user bubbles** (`bg-primary`) — should be espresso on cream.
- **Bright purple send button** and focus ring — same issue.
- **White-on-dark type** in messages — should be espresso on cream.
- Sans-serif header title — should be DM Serif Display to match mastheads.
- Rounded pill launcher with purple gradient — should be square-cornered espresso to match buttons on `/build`, `/services`, etc.

## Redesign spec

Palette (hardcoded here, since the chatbot renders via portal-like fixed positioning outside `.marketing-surface` and needs to look identical on every route):

- Panel surface: `#FAF8F5` (cream)
- Panel border: `#E5DDD0` (warm tan hairline)
- Header bar: solid espresso `#8B7355` with cream text
- Assistant text: `#2B1F14` (espresso ink) on cream
- User bubble: espresso `#8B7355` bg + cream `#FAF8F5` text
- Starter chips: cream bg, tan border, espresso text; hover fills to `#F0EBE3`
- Composer input: `#FFFFFF` bg, tan border, espresso text, espresso focus ring
- Send button: espresso bg, cream icon
- Mic button: cream bg, tan border, espresso icon; recording state uses a rust `#B8532A` accent (matches existing site accent) instead of destructive red
- Corners: `rounded-lg` panel, `rounded-md` bubbles/inputs, `rounded-sm` chips (square-ish editorial feel, no pill launcher)
- Typography: header title uses `font-serif` (DM Serif Display already loaded); body uses default sans (Fira Sans)

Launcher:
- Replace pill+gradient with a square-cornered espresso card: `#8B7355` bg, cream text/icon, tan hairline border, subtle shadow. Keep `MessageCircle` icon and "Ask Startup Labs" label.

Header:
- Solid espresso bar, cream text, `font-serif` title "Startup Labs Concierge".
- Replace `Sparkles` icon with a small serif monogram or drop the icon (Sparkles conflicts with editorial tone; per chat-ui-composition, Sparkles shouldn't be an agent identity mark). Use a small cream circle with "SL" in serif, or just the title alone.
- Icon buttons (voice/clear/close) become cream-on-transparent with `hover:bg-cream/10`.

Messages area:
- Cream bg, espresso ink. Assistant markdown uses `prose` (not `prose-invert`) with espresso overrides.
- Loading dot changes from `bg-primary` (purple) to `bg-[#B8532A]` (rust accent) so "Thinking…" reads as brand.
- Error banner: cream card with rust border/text instead of destructive red.

Starter chips:
- Cream bg, tan border, espresso text, `rounded-sm`, hover fills to `#F0EBE3` with espresso border.

Composer:
- White input surface inside a tan-bordered box; espresso focus ring.
- Placeholder text in muted espresso `#8B7355/60`.
- Send button espresso solid; disabled state 40% opacity.
- Mic recording state uses rust ring + subtle pulse.

Footer helper text:
- Muted espresso, `/contact` link in rust with underline on hover.

## Technical notes

- All values are hardcoded hex in `AskConcierge.tsx` (not tokens) because the component renders as a global fixed overlay outside the `.marketing-surface` scope and must render identically whether the current route is themed or not.
- No changes to logic, state, storage keys, edge-function calls, TTS, transcription, or hidden-prefix routing.
- No changes to `src/styles.css` or shadcn tokens — this stays scoped to one file.
- Preserve accessibility labels, keyboard handlers, focus management, and the `role="dialog"` semantics.

## Files touched

- `src/components/site/AskConcierge.tsx` — the only file changing.

## Out of scope

- Voice/audio behavior
- Chatbot knowledge or system prompt
- The dashboard/authenticated app chrome (chatbot is hidden there via `HIDDEN_PREFIXES`)
- Moving to AI Elements or the AI SDK (this is a bespoke component tied to two edge functions; a rewrite would be a separate project)
