## Why this is showing often

That banner is the preview’s automatic error recovery UI. In the current logs, the concrete trigger is Vite failing to hot-reload `src/components/hub/DocumentViewer.tsx` after recent edits. Separately, the console repeatedly shows accessibility warnings for modals missing a `DialogDescription`. Those warnings are not usually fatal, but they add noise and make the app look unstable while the document/image modal is open.

## Plan

1. **Stabilize the document modal module**
   - Inspect `DocumentViewer.tsx` for any syntax/import issues caused by the recent header-image changes.
   - Remove the need for `// @ts-nocheck` if feasible, or at minimum fix the exact code path causing hot reload to fail.

2. **Harden the header-image loading path**
   - Keep the existing signed URL cache, but ensure failed image preloads don’t cascade into repeated UI errors.
   - Confirm the modal does not clear the visible image while it is only re-signing or retrying a stored image.

3. **Fix modal accessibility warnings**
   - Add hidden `DialogDescription` text to document-related modals that currently only render `DialogTitle`.
   - This should remove the repeated `Missing Description` warnings from the console.

4. **Verify the preview behavior**
   - Re-open the Market Analysis document modal.
   - Confirm the error banner no longer appears from hot reload/runtime errors.
   - Confirm the image area either displays the generated header quickly or shows a clean retry/loading state without blanking out.

## Expected result

The frequent “An error occurred, trying to fix automatically” banner should stop appearing for this workflow, and the document modal logs should be cleaner and easier to diagnose if a real backend/image-generation issue happens later.