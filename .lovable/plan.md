# Add post-workshop "what to do next" tooltips to the Value Grid

## Goal
On each deliverable in the Value Grid that still needs the user to do something after the 7 hours (file, pay, host, publish, send, etc.), show a small info icon. Tap/hover → short, plain-English instructions an 8th-grader can follow.

## Which rows get a tooltip (and what it says)

Rows with no post-workshop action (EIN, ICP list, competitor grid, offer sheet, workflow map, first deliverable draft, headline/pitch, social posts, 30/60/90 plan, day-of timeline) → **no tooltip**.

Rows that DO get a tooltip:

1. **GA LLC filing packet** — "Go to georgia.gov Corporations site. Upload your Articles PDF. Pay the $100 fee with a card. Approval email arrives in 5–7 business days."
2. **Terms / Privacy / Service Agreement** — "Save the 3 PDFs to Google Drive. Link Terms + Privacy in your website footer. Email the Service Agreement to your first customer to sign."
3. **Bank + license + sales-tax checklist** — "Walk into your bank with your EIN letter + LLC packet to open the account. Apply for your city business license online ($50–$75). Register for sales tax at dor.georgia.gov if you sell products."
4. **Logo + palette + fonts** — "Download the logo ZIP. Upload to your website, email signature, and social profiles. Keep the brand sheet PDF — hand it to anyone making things for you."
5. **Complete 4-page website** — "Click Publish in the site builder. Buy your domain ($12/yr) and connect it — the builder walks you through it. Site is live in ~30 minutes."
6. **Stripe / Square + GA4 + email** — "Finish Stripe verification (bank routing + SSN, 5 min). Verify your business email by clicking the link they send. GA4 is already tracking — just log in weekly."
7. **Business card + flyer** — "Upload the print-ready PDFs to Vistaprint or Moo. 500 cards ≈ $25, flyers ≈ $40. Arrives in 5–7 days."
8. **6 posts + video + 30-day plan** — "Post one item every 2 days on the schedule we built. Film the 60-sec video on your phone using the script. Don't overthink it — done beats perfect."
9. **CRM + 3 KPIs** — "Log in to the CRM each Monday. Add every new lead. Check your 3 KPIs every Friday — that's it."

## Technical details

- Edit `src/lib/value-grid.ts`: add optional `postWorkshop?: string` field to `ValueRow`, fill in the 9 strings above.
- Edit `src/components/value/ValueGrid.tsx`:
  - Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip` and `Info` from `lucide-react`.
  - Wrap the table in `<TooltipProvider delayDuration={150}>`.
  - For rows with `postWorkshop`, render an `Info` icon (size-3.5, muted) next to the deliverable text. Trigger is a button (a11y). Tooltip content: small heading "After the workshop" + the instruction text, max-w-xs.
  - Apply to both desktop grid and mobile card layouts.
- No data model, route, or schema changes. No new files.

## Out of scope
- Rewording existing deliverables.
- Changing pricing, totals, or the registration form.
- Any change outside `/register`.
