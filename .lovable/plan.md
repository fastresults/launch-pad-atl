## Plan: Hover Contrast Audit + Fix

### Goal
Make every interactive hover/focus state readable across the redesigned warm editorial UI, especially buttons and CTA links on cream and espresso sections.

### What I confirmed from the code
- The marketing pages use a scoped `.marketing-surface` theme in `src/styles.css`.
- The current global overrides remap hardcoded dark-theme utilities like `text-white`, `bg-white/*`, `border-white/*`, and `bg-hero-gradient` into the cream/espresso palette.
- The prior fix neutralized hover-only background classes when they are not hovered, but there are not yet explicit hovered-state contrast rules for cases like `hover:bg-white/10` on espresso sections.
- Several marketing routes still use inline utility hover states such as `hover:bg-white/10`, `hover:opacity-90`, `hover:border-white/*`, and `hover:bg-primary/*`.
- Shared buttons come from `src/components/ui/button.tsx`, while page-level CTAs and the chatbot use direct utility classes.

### Phase 1 — Define sitewide hover contrast rules
Update the marketing-scoped CSS so hover/focus states have intentional pairings:

- **Espresso / hero sections**
  - Primary cream/white CTA hover: keep espresso text.
  - Outline CTA hover: switch to cream fill + espresso text, or stay transparent with clearly visible cream text.
  - Text links/icons: maintain cream/white contrast, not muted tan-on-brown.

- **Cream / sand sections**
  - Espresso CTA hover: use a darker espresso shade with cream text.
  - Outline CTA hover: use sand/tan fill with espresso text.
  - Card hover: border/tint changes only, never light text on light fill.

- **Dialogs, sheets, tooltips, chatbot**
  - Match the same cream/sand/espresso hover behavior.
  - Ensure close/icon buttons, starter buttons, voice/send buttons, and mobile sheet links remain readable on hover/focus.

### Phase 2 — Replace brittle hover utilities where needed
Where CSS cannot safely infer context, update the component class names directly:

- Marketing route CTAs in `/build`, dynamic build pages, `/services`, `/schedule`, `/webinar`, `/one-on-one`.
- Header desktop/mobile nav and mobile sheet actions.
- Chatbot launcher, panel controls, starter chips, send/voice/listen controls.
- Dialog/sheet action buttons if they inherit old dark hover styling.

### Phase 3 — Normalize button behavior
Keep the existing shared `Button` component intact for the app, but add marketing-safe scoped overrides so default, outline, ghost, and link buttons render correctly inside `.marketing-surface` and `.marketing-dialog`.

### Phase 4 — Visual QA pass
Use browser checks to verify hover/focus contrast on representative pages:

- Home `/`
- Workshops `/build`
- Services `/services`
- Schedule `/schedule`
- Facilitator `/facilitator`
- Register/contact modal or sheet states
- Chatbot open + launcher states

For each page, inspect key buttons/links in normal and forced-hover states and fix any remaining low-contrast pairings.

### Acceptance criteria
- No white/cream text appears on light cream/sand hover fills.
- No espresso/dark text appears on espresso hover fills.
- Hover/focus states are visibly interactive but still brand-consistent.
- The fix is scoped to marketing UI and does not disturb authenticated app screens.