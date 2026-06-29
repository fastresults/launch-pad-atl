# Fix: Step 5 "Build kit" footer blocks the user from reaching Launch

## Problem
In `SocialAutopilot.tsx` (Step 5), the primary CTA is gated by `allDone` — every platform/asset task must have a generated image. If even one tile is missing (e.g. the Threads avatar in the screenshot), the footer flips to **Generate all** and there is no way to advance to Step 6 (Launch). Users who have already produced and regenerated the assets they care about are stuck.

## Fix

### 1. Replace single-CTA footer with a two-button footer
File: `src/components/hub/social/SocialAutopilot.tsx` (footer of `Step5BuildKit`).

- Always show **Continue to launch** as the primary CTA once `anyDone` is true (at least one asset generated). This calls the existing `onContinue`.
- Add a secondary **Generate missing** button (outline) shown only when there are pending/errored tiles. It runs `runAll` but skips tiles whose `status === "done"` (current `runAll` already does this).
- When nothing has been generated yet, keep today's behavior: primary **Generate all**, no Continue.
- Disable Continue while `running` is true so a user can't navigate away mid-batch.

### 2. Soft warning when advancing with gaps
When the user clicks Continue and `!allDone`, show an inline note above the footer (not a blocking dialog): "X of Y assets generated. You can finish the rest later from this step." No confirmation modal — just informational, so flow stays fast.

### 3. Tile-level clarity for the empty Threads case
The Threads row in the screenshot shows a placeholder icon and no Regenerate button (the button only renders when `done || err`). Add a **Generate** button on tiles that are neither done nor errored so a single missing tile can be filled without the bulk action.

### 4. Keep existing behavior intact
- `Regenerate` per tile, `Regenerate all`, `Keep` toggle, preview modal, and the bulk `runAll` loop are unchanged.
- No edge function or schema changes.
- No copy changes elsewhere in the wizard.

## Technical details
- Derive `pendingCount = tasks.filter(t => t.status !== "done").length` and `doneCount = tasks.length - pendingCount` for the footer caption.
- Footer JSX (pseudocode):
  ```
  <Back />
  <div className="flex items-center gap-2">
    {!allDone && anyDone && (
      <span className="text-[11px] text-muted-foreground">
        {doneCount} of {tasks.length} ready
      </span>
    )}
    {pendingCount > 0 && anyDone && (
      <Button variant="outline" onClick={runAll} disabled={running}>
        Generate missing ({pendingCount})
      </Button>
    )}
    {anyDone ? (
      <Button onClick={onContinue} disabled={running}>Continue to launch →</Button>
    ) : (
      <Button onClick={runAll} disabled={running}>Generate all</Button>
    )}
  </div>
  ```
- Per-tile "Generate" button: render when `!done && !err` (mutually exclusive with the existing Regenerate button). Calls `generateOneKitTask(snapshotId, t)` then invalidates the `social-cover` query.

## Out of scope
- Why the Threads avatar failed to generate in the first place (separate issue — likely a per-task error swallowed by the bulk loop). Can be a follow-up if it recurs after this fix.
