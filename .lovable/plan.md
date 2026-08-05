# Why that CRM line is still there — and the second pass to fix it

## What happened

The first audit only rewrote one field: the `walkOuts` array in each workshop. It graded the CRM line "CRM picked and set up" as over-scoped and rewrote it to "CRM chosen and **stood up with your pipeline built**" — which is barely a step down. The audit tightened the wording without tightening the promise, and it never touched the other four places the same claim appears.

So the promise is still leaking from surfaces the audit never opened:

- Workshop detail copy (`build-workshops.ts`): one-liner "Your CRM live. Your first sequence sending.", subhead "we pick your CRM… write three sequences live", agenda outputs, and comparison lines like "CRM picked and live, 3 production sequences shipped".
- Artifact previews and decision copy (`workshop-products.ts`): stamp "Loaded into your CRM in the room · sending by Monday", "CRM live, pipeline mirrored, your welcome sequence written and **sending**, and the automations that run it while you're on a job", "five real automations built live on your accounts", "chart of accounts live, receipts flowing, first month closed".
- Audit intake promises (`workshop-audit.ts`): "A follow-up sequence written, loaded, and **sending from your own tool** before you leave", and "Your entity **filing prepared**, your client contract **signed-ready**, and your books **opened and reconciled to today** before you leave".

None of these survive contact with a 2h45 morning where the attendee's own accounts, DNS, vendors, and CPA are outside the room.

## The rule this pass enforces

Every walk-out claim must be one of exactly three things, and must read that way:

1. A **decision made** and written down (with the reasoning that killed the alternatives).
2. A **first real version** of one artifact, drafted in the room.
3. **One thing configured** in a tool the attendee already controls and can show on screen.

Banned, everywhere, regardless of surface: "live", "sending", "shipped", "running", "wired", "stood up", "flowing", "reconciled", "filed", "integrated", counted volumes ("3 sequences", "five automations", "10 assets"), and anything that depends on DNS propagation, vendor approval, account access we don't have, or a licensed professional.

## What changes

**One CRM lane example (the line you flagged):**

- Now: "CRM chosen and stood up with your pipeline built — Hubspot, Attio, or Folk — picked for your stage and team, not by hype"
- After: "Your CRM chosen — Hubspot, Attio, or Folk — scored against your stage and team, with your pipeline stages defined and the setup steps listed"

**Across all nine lanes**, the same treatment applied to every surface that carries a promise:

| File | Fields rewritten |
| --- | --- |
| `src/lib/build-workshops.ts` | `oneLiner`, `subhead`, `walkOuts`, every agenda block `Output:`, comparison `lead` lines |
| `src/lib/workshop-products.ts` | `artifactPreview.stamp` and `.lines`, `decisionHeadline`, `decisionBody`, objection answers that imply finished systems |
| `src/lib/workshop-audit.ts` | the "you leave with" promise on each audit intake |
| `supabase/functions/atlanta-viability/index.ts` | strengthen SCOPE TRUTH: add the banned-verb list explicitly so the AI read can't reintroduce "live/sending/running" |
| `src/components/home/IdeaSnapshotModal.tsx` | static invitation copy re-checked against the same rule |

Perceived value is protected by trading finality for specificity: instead of "CRM live", the copy names the exact decision, the exact artifact, and the exact next step the attendee owns. Named and bounded reads more credible than vague and finished.

**Documentation:** `.lovable/walkout-audit.md` gets a second-pass section recording the banned-verb rule, the surfaces the first pass missed, and every line changed — so the rule is checkable next time instead of re-litigated.

## Scope notes

- Copy only. No layout, component, schema, or route changes.
- Foundation lane's four walk-outs already pass the rule and stay untouched.
- The morning is 8:45–11:30 (2h45). If it should be scoped and described as a strict 2 hours, that's a separate change to agendas and schedule — say the word and it goes in.
