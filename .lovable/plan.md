# Admin page intros

Add a consistent intro block at the top of every admin dashboard page so admins immediately understand what the view manages.

## Component

Create `src/components/admin/AdminPageHeader.tsx`:
- Props: `title: string`, `description: string`, optional `actions?: ReactNode` (for future use).
- Renders an `h1` (text-3xl, tracking-tight) and a muted `p` below it, constrained to `max-w-3xl` for readability.
- Replaces the ad-hoc heading currently in `admin.index.tsx` and is added to all other admin route components.

## Pages and copy (~60 words each)

Applied to one route file each under `src/routes/_authenticated/_admin/`:

1. **Dashboard** (`admin.index.tsx`)
   "Your command center for Startup Labs. See pending member approvals, fresh applications, confirmed registrations, and new inquiries at a glance. Use this view to triage what needs your attention today, then jump into the specific queue to take action. Counters update in real time as your team works through each list."

2. **Members** (`admin.members.tsx`)
   "Every person who created a Startup Labs account lives here. Approve new signups to unlock their founder dashboard, review their intake answers, and manage existing members. Pending members cannot access founder tools until you approve them, so clearing this queue is the fastest way to onboard new startups into the program."

3. **Applications** (`admin.applications.index.tsx`)
   "Applications submitted through the public apply form. Filter by status, search by name or email, edit details inline, and move applicants through Applied → Reviewing → Shortlisted → Selected. Use bulk actions to update or remove multiple records at once. Selected applicants can be promoted into a registration so they can confirm their cohort spot."

4. **Registrations** (`admin.registrations.tsx`)
   "Founders who have been promoted from an application and are confirming their seat in a cohort. Track who has paid, who is pending, and who has dropped. Resend confirmation emails, update cohort assignments, and prepare the final attendee roster from this view before the cohort officially kicks off."

5. **Attendees** (`admin.attendees.tsx`)
   "Active founders currently enrolled in a cohort. Open an attendee to view their startup profile, workflow progress, uploaded deliverables, and media. Use this view during the program to monitor engagement, unblock founders who are stuck on a milestone, and confirm each team is keeping pace with their cohort's curriculum."

6. **Review queue** (`admin.review.tsx`) — super only
   "Accounts that have signed up but not yet completed their startup intake or required materials. Super admins can manually unlock a founder's dashboard from here when an exception is needed. Use this queue to follow up with stalled signups before they go cold and to override blocks when context warrants it."

7. **Inquiries** (`admin.inquiries.index.tsx`)
   "Messages submitted through the public contact form. Read the full inquiry, mark it as in progress or resolved, and reply directly via email. New inquiries are flagged with a badge so nothing slips through the cracks. Resolve threads here to keep the queue focused on conversations that still need a human response."

8. **Cohorts** (`admin.cohorts.tsx`) — super only
   "Define the cohorts founders apply to and graduate from. Create new cohorts with start and end dates, set capacity, open or close applications, and archive past sessions. The cohort selected on an application or registration drives which programming and milestones a founder sees inside their dashboard, so keep this list accurate."

9. **Site settings** (`admin.site.tsx`) — super only
   "Control the public marketing site without redeploying. Edit hero copy, navigation labels, calls to action, contact details, and SEO metadata. Changes save immediately and reflect on the live site for visitors and search engines. Use this view to keep messaging current as cohorts, partners, and program details evolve throughout the year."

10. **Media library** (`admin.media.tsx`) — super only
    "Upload and manage images used across the public site and founder dashboard. Reuse assets without re-uploading, copy hosted URLs into editors, and delete files that are no longer referenced. Keeping this library tidy ensures the marketing site stays fast and that founders always see current branding instead of stale or duplicate imagery."

11. **Users & roles** (`admin.users.tsx`) — super only
    "Grant or revoke admin and super admin access for Startup Labs staff. Search by email, change a user's role, and audit who can manage applications, registrations, and site content. Only super admins can promote others, so be intentional — anyone listed here can read and modify founder data across the platform."

## Out of scope

- Editing the public site or founder views.
- Restructuring nav or moving routes.
- Making copy CMS-editable (hard-coded strings for now).
