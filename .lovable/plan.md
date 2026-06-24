## Make "🧪 Fill test concept" populate every form input

**Today:** it only fills Company name, Website URL, Business concept, and (for competitor path) the Differentiation field. Founder/market fields stay empty, so the Create button stays disabled after one click.

**Change:** when pressed, the button fills every required + optional input on the page so the form is immediately submittable.

### Fields the button will populate

| Field | Source |
|---|---|
| Company name | `data.company` (already) |
| Website URL (if not manual) | `data.url` (already) |
| Business concept | `data.concept` (already) |
| Differentiation (competitor path) | `data.diff` (already) |
| Founder name | derived from logged-in user's display name, else `"Test Founder"` — only fill if empty |
| Founder email | logged-in user's email, else `"test+{ts}@example.com"` — only fill if empty |
| Founder phone | `"+1 555 010 0123"` — only fill if empty |
| Country | leave existing default ("United States") |
| City | `"Atlanta"` if empty |
| State / region | `"Georgia"` if empty |
| Market scope | `"national"` (matches the kind of brands in `SEED_URLS`) — always set |
| Industry | derive from the scraped concept via a small keyword map on the client (SaaS / Fintech / DevTools / AI / Productivity / E-commerce), fallback `"Software & SaaS"` |
| Sub-industry | first sentence fragment of `data.concept` truncated to ~60 chars, else left blank |
| Path selector | leave as the user picked (own / competitor / manual) |

### Implementation notes (technical)

- Single edit in `src/routes/_authenticated/dashboard/hub.new.tsx`, inside the existing `onClick` of the "🧪 Fill test concept" button.
- After the existing `setCompanyName / setWebsiteUrl / setBusinessConcept / setDiff` calls, add setter calls for the founder + market fields, each guarded with `if (!currentValue.trim())` so we don't stomp anything the user typed.
- Add a tiny pure helper `guessIndustry(concept: string)` at module scope (keyword matching, no network) used only when `industry` is empty.
- Email fallback uses `Date.now()` to avoid collisions when re-clicked.
- No new files, no edge-function changes, no schema changes.
- Dev-only behavior — keep the existing `// TODO: remove after testing` comment.

### Acceptance

- Click "🧪 Fill test concept" on a fresh `/dashboard/hub/new` → all required fields are filled and "Create & enrich →" becomes enabled in one click.
- Clicking again with user-edited founder fields preserves those edits (only blanks get filled).