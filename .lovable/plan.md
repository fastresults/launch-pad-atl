# Make the delivery decision a featured band, not a pill

Right now the single most consequential choice on the Operationalize page — *who actually does this work* — is rendered as an 11px pill wedged into a row of small grey metadata next to "3 past due", "Compare the two" and "How this works". It reads like a filter, not a commitment. It should look like the control that reshapes the entire dashboard, because it is.

## What changes

**1. Promote it out of the metadata row into its own band**

A full-width card directly under the header (above the view switcher), visually distinct from the surrounding cards:

```text
┌──────────────────────────────────────────────────────────────┐
│ DELIVERY MODE                                                │
│                                                              │
│  ┌── I'm building it ───┐  ┌── Startup Labs builds it ─────┐ │
│  │ hammer               │  │ team          ✓ ACTIVE        │ │
│  │ You own all 106 steps│  │ We own the 41 specialist steps│ │
│  │ 41 are specialist    │  │ You keep approvals + calls    │ │
│  └──────────────────────┘  └───────────────────────────────┘ │
│  Named owner + committed date on every team-led step.        │
│  Compare the two →      Change anytime.                      │
└──────────────────────────────────────────────────────────────┘
```

- Two side-by-side selectable cards, not a segmented pill. Each carries an icon, a title, one consequence line, and a live count pulled from the real task list.
- The active card gets a primary ring, a tinted surface, and an "Active" check badge. The inactive card stays quiet but is obviously clickable (hover lift + border warm).
- The band uses the same on-brand treatment as the rest of Operations (soft gradient wash, subtle stage art at low opacity) so it feels featured rather than bolted on.

**2. Make the consequence legible before the click**

Under each card, a one-line live delta: "Switching moves 41 steps to Startup Labs" / "Switching moves 41 steps back to you." Today that number only appears inside the confirm dialog, after the user has already committed to the interaction.

**3. Keep the confirm dialog, upgrade it**

Same alert dialog, but restate the target mode as a heading with the icon, list the counts as two stat rows rather than a sentence, and label the action button with the mode itself ("Hand it to Startup Labs" / "Take it back on my side") instead of the generic "Switch".

**4. Clean up what's left behind**

"Compare the two" moves into the band (it belongs to the decision). "How this works" and the read-only / past-due indicators stay in the small metadata row where they belong.

**5. Read-only parity**

On the shared link when the viewer can't edit, the band still renders — the active mode card shown as a locked state with a short "Set by Startup Labs" note — so the founder always sees which path they're on. No layout divergence between hub and shared link.

## Technical notes

- `src/components/ops/DeliveryModeToggle.tsx`: add a `variant` prop — `"pill"` (existing, kept for any compact use) and `"band"` (new default in the dashboard). Band variant renders the two-card layout and consumes the existing `changeSummary` helper for the live delta lines.
- `src/components/ops/OpsDashboard.tsx`: move `<DeliveryModeToggle />` and the "Compare the two" button out of the metadata row (lines ~190–216) into a new band placed between the foundation chips and the view switcher; leave `stuck` / `late` / read-only text in place.
- No data model, edge function, or business logic changes — `onDeliveryMode` fires exactly as it does today.
- Both the Agency Hub and the shared link render `OpsDashboard`, so parity is automatic.
