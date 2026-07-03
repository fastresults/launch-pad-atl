## Two things in one turn

### 1. Fix the build (blocking)

`src/routes/_authenticated/_admin/admin.index.tsx` imports `ConfirmDialog` from `@/components/ui/confirm-dialog`, but I only shipped `PromptDialog`, `useConfirm`, and `usePrompt` last turn. The named export never existed, so Rollup fails.

Add a `ConfirmDialog` component export to `src/components/ui/confirm-dialog.tsx` matching the call-site API in admin.index.tsx:

```
open, onOpenChange, title, description,
confirmLabel, cancelLabel?, variant ("default" | "destructive"),
reasonLabel?, reasonPlaceholder?, loading,
onConfirm(reason?: string)
```

Built on shadcn `AlertDialog`. When `reasonLabel` is set, render a `Textarea` inside the dialog and pass its value to `onConfirm`. This is a controlled dialog (no context needed) — matches how admin.index already uses it.

### 2. Add three access modes without cluttering the hero

**Recommendation:** keep the hero visually unchanged (one primary CTA), and introduce a single new element that opens all three paths on demand. Concretely:

**A. One "How to work with Adam" chip under the primary CTA** (replaces nothing, adds one line).

- Text: "Prefer a webinar or 1:1?" as a subtle underlined link.
- Clicking it opens an **`AccessModeDialog`** (in-app modal, shadcn Dialog) that presents the three modes as a compact 3-card picker:
  1. **In‑person workshop** — the current default. CTA: "Reserve a seat" → `/register`.
  2. **Live webinar** — same framework, remote, group cohort. CTA: "Join the next webinar" → `/webinar` (new route, marketing landing).
  3. **1:1 with Adam** — private working session. CTA: "Book a 1:1" → `/one-on-one` (new route).

Each card: icon, one-line promise, price/format line, CTA button. No hero real estate lost — the primary reserve-your-seat button stays as the highest-intent path.

**B. Two lightweight marketing routes** (new files) so the CTAs land on a real page instead of a `mailto:`:

- `src/routes/webinar.tsx` — hero + framework recap + next-webinar date + registration form (reuses `RegisterFramework` shell, filtered to webinar mode).
- `src/routes/one-on-one.tsx` — hero + pricing + Calendly-style booking CTA (link to Adam's Calendly for now; we can wire the Calendly connector later if you want live availability).

Both routes registered in `src/App.tsx`.

**C. Header nav** — add a single "How to work with Adam" link (desktop nav + mobile menu) that opens the same `AccessModeDialog`. Zero new nav bloat if we replace/rename an existing generic item; otherwise it's one added link.

**D. Funnel/conversion notes:**

- Primary hero CTA stays "Reserve your seat — $197" (highest-converting path we already have).
- Secondary access options live behind one click, so low-intent visitors self-segment without dragging the hero into a 3-way choice paralysis.
- Each mode's landing page uses the same proof stack (framework, testimonials, FAQ) so we don't fragment social proof.
- Analytics: fire a `mode_selected` event with `{workshop|webinar|one_on_one}` from the dialog so we can measure funnel split.

### Out of scope (this turn)

- Calendly live availability wiring, webinar registration backend, pricing for 1:1 — I'll stub CTAs and copy; you can decide pricing/dates and we'll wire it next.
- Any hero redesign beyond the one secondary link.

### Open question before I build (optional)

Do you have current pricing/format for the webinar and 1:1 (e.g., "$97 webinar", "$1,500 1:1 half-day")? If yes I'll bake it into the cards and landing pages; if not I'll ship copy placeholders labeled clearly.
