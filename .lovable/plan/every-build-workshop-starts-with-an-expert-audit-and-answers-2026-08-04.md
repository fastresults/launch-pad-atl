# Every build workshop starts with an expert audit and answers 10 named pains

Eight workshops (brand, website, sales, email & CRM, social, content, AI ops, legal & money) get the same three-part frame, in copy and in reality. Foundation is untouched.

```text
1. AUDIT      Submit the real material for that lane — your
              site, your brand assets, your quotes, your
              follow-up sequences, your books. 48 hours
              before the morning, you get a graded expert
              audit of that lane.
2. TEN PAINS  The workshop is organized around the ten
              specific problems that audit keeps finding.
3. GUARANTEE  One named outcome. If you don't get it,
              we keep working with you until you do.
```

## 1. The pre-workshop audit (real, not just copy)

**Intake.** After registering for a build workshop, the attendee submits the material that lane is actually about, named in that lane's language: Brand asks for the logo files, color and type in use, and the last five things they published. Website asks for the live URL, the page that's supposed to convert, and current traffic reality. Sales asks for the current price sheet, the pitch they send, and the last three deals lost. Email & CRM asks for the sequences running, list size, and where leads currently sit. Social asks for the handles and the last thirty posts. Content asks for what they've published and the questions buyers repeat. AI ops asks for the weekly tasks eating the most hours and the tools already paid for. Legal & money asks for entity status, the contracts in use, and how the books are kept.

**The audit itself.** AI generates an expert-grade audit scored against the ten pains for that lane. Each pain gets a grade, the specific evidence from their own material, the cost of leaving it, and what the morning will do about it. It ends with the single prescribed outcome the morning is aimed at for this person.

**Review before send.** Audits land in Super Admin for review and edit — nothing reaches an attendee unreviewed. Approving sends the audit by email and unlocks it in their dashboard, targeted at 48 hours before the workshop.

## 2. Ten pains as the spine of every workshop

The ten pains per workshop already exist in the data; right now the pages only argue three. They become the visible structure:

- Homepage workshop stack: all ten, numbered, each with the fix.
- `/build/:slug`: the ten as the core section, and the agenda blocks explicitly labeled with which pains that block kills.
- Hero, audit, agenda, and artifacts all reference the same ten — one vocabulary per workshop.

## 3. Copy pass, workshop by workshop

For each of the eight, rewritten so audit → ten pains → guaranteed outcome reads consistently:

- Hero and one-liner lead with the audit ("Your morning starts with an audit of your actual site, not a lecture").
- One named, specific outcome per workshop, stated plainly (Website: a page whose single job is booking, live before you leave. Sales: a priced offer and a first message sent).
- The guarantee stated in the same words everywhere: you leave with the named artifact, or we keep working with you at no additional cost until you do.
- Objections, fit columns, and the decision section retuned to the new frame.

**On the guarantee:** an unlimited "until it's fixed" promise is real work you're committing to. The plan writes it with a defined scope — the named artifact for that workshop, redeemable within 30 days, via the follow-up channel and one working session. Tell me if you want it looser or tighter.

Language stays inside the existing standard: real artifacts, no plan/blueprint/roadmap talk for the offer.

## Build order

1. Data + copy layer: outcomes, guarantee, ten-pain surfacing on the homepage and `/build/:slug`.
2. Intake: schema, form, post-registration flow.
3. Audit generation + Super Admin review and send.
4. Attendee-facing audit view in the dashboard.

## Technical notes

- `src/lib/workshop-pains.ts` gains `grade`/`auditCheck` fields per pain so the audit scores against the same ten.
- New `src/lib/workshop-audit.ts`: per-slug intake field definitions, the prescribed outcome, and guarantee copy.
- New tables: `workshop_audit_intakes` and `workshop_audits` (status: pending → generated → approved → sent), RLS scoped to the attendee plus admin, with GRANTs.
- New edge function `workshop-audit-generate` using the AI gateway; audit stored as structured JSON so it renders in both the admin review screen and the attendee view.
- Admin screen at `/admin/audits`, following the `/admin/hero-images` pattern.
- `WorkshopPains.tsx` drops the `slice(0, 3)`; `WorkshopStack.tsx` and `build.$slug.tsx` add the audit and guarantee sections.
- `build-workshops.ts` gains `auditPromise`, `prescribedOutcome`, and `guarantee` per workshop; agenda blocks get the pain ids they resolve.
