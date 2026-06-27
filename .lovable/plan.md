I understand the gap: the previous implementation only reset after deletion and showed a fallback banner on the brief page. It did not guarantee that stale brief/profile fields are cleared before the page renders when the user loads `/dashboard/brief` with zero ventures.

## Plan

1. **Add a required “workspace freshness” check on brief load**
   - When `/dashboard/brief` loads, first check the authenticated user’s venture count.
   - If `venture_snapshots` count is `0`, immediately call the existing backend reset routine: `reset_founder_workspace(user_id)`.
   - This clears the stale brief, founder profile, founder memory, market profile, goals, stage intake, filing info, and venture-specific profile fields.

2. **Prevent stale answers from flashing onscreen**
   - Add a local loading gate such as `workspaceChecked` / `workspaceResetting`.
   - Do not render `BriefReview`, the “Your answers” screen, or populated question fields until the zero-venture check finishes.
   - While checking, show a neutral loading state like “Preparing a fresh workspace…” so users never see old startup data.

3. **Reinitialize the brief state after reset**
   - After reset succeeds:
     - Clear local `values` to empty strings for every brief field.
     - Set `idx` back to `0`.
     - Set `mode` to `question`.
     - Mark `initialized` as complete only after the cleared data is applied.
     - Invalidate/refetch related queries: brief, profile, founder profile, market/profile data.

4. **Remove the weak fallback behavior**
   - Remove or bypass the “Leftover answers from a deleted venture” banner path for this route.
   - The correct behavior should not require the user to notice a warning or click “Reset”; it should happen automatically when there are no ventures.

5. **Make the logic safe and non-destructive**
   - Keep the backend guard already in `reset_founder_workspace`: it refuses to reset if any venture still exists.
   - That means even if the frontend check is stale or duplicated, the backend will not wipe active-venture data.

6. **Verify the workflow**
   - Test the page with zero ventures and existing stale brief data: it should load empty at Question 1, not the “Your answers” review screen.
   - Test with one or more ventures: existing brief/profile fields should remain untouched.
   - Test refresh/revisit behavior: no stale answers should reappear after reload.