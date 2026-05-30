## Wire up the inquiry system into navigation

The inquiry form (`/contact`) and admin inbox (`/admin/inquiries`) were built but never linked from anywhere, so they're invisible. Three small edits:

### 1. Admin sidebar — add Inquiries
In `src/lib/admin-nav.ts`, add an entry under the "Operations" group:
```
{ to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare,
  group: "Operations", badgeKey: "inquiriesNew" }
```
The `MessageSquare` icon is already imported. The `inquiriesNew` badge key is already wired through `getAdminBadges`, so the unread count will appear automatically.

### 2. Public footer — add Contact link
In `src/components/site/Footer.tsx`, add a `<Link to="/contact">Contact</Link>` next to the existing Privacy / Terms links.

### 3. Public header — add Contact link
In `src/components/site/Header.tsx`, add a Contact link to the main nav so visitors can actually find the form without knowing the URL. (I'll match the existing nav styling.)

### Out of scope
No changes to the form itself, the email templates, the database, or the admin detail page — those were already built in the previous turn and are working. This is purely the missing navigation wiring.
