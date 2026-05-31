## Goal

Add short admin-facing descriptions (~40 words each) above the "New applications" and "Confirmed registrations" panels on `/admin`, so admins immediately understand what those two free-cohort sections represent.

## Change

### `src/routes/_authenticated/_admin/admin.index.tsx`

1. Extend the `Panel` component with an optional `description?: string` prop. When present, render it as a small muted paragraph between the title row and the bordered list container (`text-xs text-muted-foreground max-w-2xl mb-3`).

2. Pass copy to the two free-cohort panels:

   - **New applications** (~40 words)
     > "Founders who applied to the free cohort but haven't been admitted yet. Review each application, then move them through Reviewing, Shortlisted, Selected, Waitlist, or Rejected. Selecting an applicant promotes them to a confirmed registration and unlocks their founder dashboard."

   - **Confirmed registrations** (~40 words)
     > "Founders accepted into the current free cohort. Each entry represents a secured seat — they've cleared application review and are enrolled in programming. Use this list to confirm headcount, follow up on onboarding, and prep cohort communications."

3. Leave the "Members" panel untouched (it already has a self-explanatory header from the page).

## Out of scope

- No new copy on the page header, members panel, or stat cards.
- No backend / schema / route changes.
