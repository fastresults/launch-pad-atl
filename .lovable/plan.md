Apply the Stage 1 accuracy edits from the audit to `src/lib/curriculum-data.ts` only.

## Edits

**Line 34 — take-home**
Replace "state LLC filing packet" with wording that covers the structure choice:
> "Your state formation packet (LLC, S-Corp election, or Sole Proprietor — whichever fits), EIN application, and signed legal kit (Terms, Privacy, Service Agreement) — all customized to your business and ready to submit, plus a funding model with 12-month runway, a business plan with pro formas, an investor-ready pitch deck, and a fundraising kit ready to send. File Monday, start taking money the same week."

**Lines 36–44 — walkOut**
- Replace item 1 with: "Formation documents pre-filled in your state's filing agency account — Articles of Organization or Certificate of Formation, whichever your state uses (all 50 states supported)"
- Insert after item 1: "Structure recommendation — LLC, S-Corp election, or Sole Proprietor — matched to your revenue and salary plans"
- Insert after new structure item: "Operating Agreement drafted for your members and ownership split"
- Leave remaining items unchanged.

**Lines 47–51 — afterWorkshop**
Change first item to: "Submit your state's formation document + filing fee from home (about 10 minutes — skip if you chose Sole Proprietor)"

**Line 53 — covers**
Replace with: `["Entity structure", "State formation packet", "EIN", "Operating agreement", "T&Cs / privacy", "Service agreement"]`

**Lines 55–70 — task 1**
- title: "Choose your structure & prepare your state formation packet"
- deliverable: "Your state-specific packet: structure chosen (LLC, S-Corp, or Sole Proprietor), name confirmed available, registered agent selected, member info entered, Secretary of State account created, and your state's formation document (Articles of Organization or Certificate of Formation) pre-filled."
- tool: "Secretary of State filing walk-through — all 50 states, LLC / S-Corp / Sole Prop"
- details:
  - "Pick LLC vs Sole Proprietor vs S-Corp election using a 5-question decision tree tuned to your revenue and salary plans"
  - "Confirm name availability on your state's SOS business search"
  - "Decide registered agent (you, partner, or paid service)"
  - "Create your state SOS account and pre-fill your state's formation document (Articles of Organization or Certificate of Formation)"
- takeaway: "Your state formation packet — structure locked, formation document pre-filled, registered agent set, ready to submit."
- followUp: "Submit your state's formation document and pay the filing fee from home — typically a 10-minute step (skip if you chose Sole Proprietor)."

## Out of scope
No changes to tasks 2 or 3, other stages, or any components. No changes to the legal-setup engine.

## Verification
Reload `/schedule#stage-1` and confirm the task 1 block, take-home, walk-out list, after-workshop list, and covers chips all read with the new state-agnostic, multi-structure language.
