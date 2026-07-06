## Root cause

The reset logic cleared field state, but Step 1 still renders saved memory chips from the full reusable library list. So even after `reuseSelected` is cleared, the Smashburger source remains visible in the "Your source memory" area, making it look like Reset failed.

## Fix

Update Step 1 so **Reset step 1 removes all sources from the active venture intake view**, not just from synthesis state.

### 1. Split "active sources" from "available library"

- Active Step 1 memory should render only selected sources: `reuseSelected[id] === true`.
- Saved library sources should appear only inside the add-more picker / expanded memory selector.
- After reset, no selected sources means the Smashburger chip disappears from the main Step 1 area.

### 2. Reset must create a clean active intake state

When the user confirms **Reset step 1**:

- Clear `reuseSelected`.
- Clear uploaded files, scraped URLs, URL input, AI-filled markers, processed state, auto-synthesis signature, and all Step 1 fields.
- Set a small `hasResetStepOne` flag so the initial auto-attach behavior cannot re-select library memory immediately after reset.
- Keep the saved library files intact.

### 3. Correct the Step 1 UI copy after reset

After reset, show the empty-state version:

- Heading: `Give us something to work with`
- Helper text: `Drop an asset, paste a link, speak, or type — we'll fill the rest.`
- The Smashburger chip should not appear in this primary Step 1 area.
- Keep **Yes, add more** so the user can intentionally re-add saved sources.

### 4. Prevent accidental re-synthesis from hidden saved memory

The synthesis inputs should use only active sources:

- Selected saved sources
- New uploads
- New links
- Typed / spoken concept

Saved-but-unselected library sources must not feed the AI after reset.

### 5. Verification

Use the live preview to confirm this exact flow:

1. Load `/dashboard/hub/new` with Smashburger memory present.
2. Click **Reset step 1**.
3. Confirm **Yes, reset**.
4. Verify:
   - Smashburger chip is gone from the main Step 1 area.
   - Step 1 shows the empty-state copy.
   - Step 2 AI-filled badges are gone.
   - Saved library source can still be re-added via **Yes, add more**.
