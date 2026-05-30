## Plan

1. Update the free-cohort application success experience to include an explicit Contact action.
   - Add a clear Contact link/button in the selection-application success card, since that is the post-submit screen the applicant is actually seeing.
   - Keep the existing site-wide Contact nav/header/footer links intact.

2. Fix the applicant-name bug in the free-cohort confirmation email flow.
   - Trace the application confirmation path from `submitFounderApplication` through the queued app-email renderer.
   - Correct the data mapping so the confirmation always uses the saved applicant name from the application record and never falls back to unrelated text like “See attached.”
   - Verify the greeting and any other personalized fields use the same canonical source.

3. Validate the full end-to-end behavior.
   - Submit a fresh test application.
   - Confirm the success UI shows Contact in the right place.
   - Confirm the saved application record, queued email payload, and rendered confirmation all show the applicant’s real name.

## Technical details
- Public UI files likely involved: `src/components/register/RegisterSelection.tsx` and possibly shared site navigation only if a gap is found in that specific flow.
- Application flow files likely involved: `src/lib/applications.functions.ts`, `src/lib/email/enqueue.server.ts`, and the `application-received` email template / send path.
- No backend schema change is planned unless the trace reveals data is being transformed incorrectly before queueing.