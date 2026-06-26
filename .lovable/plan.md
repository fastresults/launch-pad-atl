## Replace sidebar hover tooltips with click-to-open info icons

**File:** `src/components/dashboard/AppSidebar.tsx` (the sidebar with hover tooltips).

### Changes

1. Remove the existing hover `Tooltip`/`TooltipTrigger` wrapping the nav label.
2. Next to each nav label, add a small `Info` icon (lucide-react, ~14px, muted color) as a `Popover` trigger.
   - `onClick` calls `e.preventDefault()` + `e.stopPropagation()` so clicking the icon does not navigate.
   - Icon is keyboard-focusable (`<button type="button">`) with `aria-label="What is {label}?"`.
3. Use shadcn `Popover` (click-to-open, dismissible) instead of `Tooltip`. Content:
   - `side="right"`, `align="start"`, max width ~260px
   - Neutral surface (`bg-popover text-popover-foreground border`) — no purple blob
   - Small text size, the existing 30-word description
4. Mobile: popover works on tap natively; ensure z-index sits above the sidebar sheet.
5. Keep the icon subtle: `text-muted-foreground hover:text-foreground`, only visible inline (always shown, not hover-only, so users discover it).

### Out of scope
- No copy changes to the descriptions themselves.
- No changes to other tooltips elsewhere in the app.
