## Plan: Make `/dashboard/day` outcome-first instead of document-first

### Goal
Rewrite the workshop dashboard copy so founders understand what they leave able to do — not that they receive “20 documents.” The tone should feel clear, confident, and useful to Millennial/Gen Z founders: less formal, less corporate, more “now I know what I’m building and what to do next.”

### Copy direction
- Replace “documents” as the main value promise with founder outcomes like:
  - know who you serve
  - explain why people should care
  - price with confidence
  - map the first customers
  - understand the money
  - talk to advisors, lenders, partners, or early supporters
  - leave with a clear next-week action plan
- Use “receipts,” “working pieces,” “startup toolkit,” “guides,” “playbooks,” and “prep” only where they clarify value.
- Keep the “20” as a proof point, but not the headline value. Example: “You leave with the thinking, tools, and next steps behind 20 founder-ready assets.”
- Avoid copy that sounds like paperwork, compliance, boardroom language, or investor cosplay.

### Page-level changes
1. **Header**
   - Change from a schedule/document framing to a confidence framing.
   - Example direction: “Your workshop morning” with supporting copy like: “By the end, you’ll know what you’re building, who it’s for, how it makes money, and what to do first.”

2. **Hero value strip**
   - Replace “Walk out with 20 documents” style language.
   - New emphasis: “Walk in with an idea. Walk out knowing what to do with it.”
   - Body copy should explain that the AI-first workflow captures the founder’s thinking and turns it into practical startup tools, not generic paperwork.

3. **Outcome section**
   - Rename from “What you walk out with” if needed to something more useful, such as “What you’ll be able to do after this.”
   - Frame each pillar around founder capability:
     - Foundation → “Say who it’s for and why it matters.”
     - Strategy → “Know how you’ll reach people and make money.”
     - Operations → “See how the startup actually runs.”
     - Finance → “Understand the numbers without pretending to be a CFO.”
     - Governance/Risk → “Know what to protect, decide, and ask for help with.”

4. **Pillars section**
   - Keep the five-part framework, but stop describing pillars by document count.
   - Use outcome subcopy for each pillar instead of “5 docs / 4 docs.”
   - If the count appears, tuck it into a secondary line like “Includes the working assets behind this step,” not as the main message.

5. **Schedule section**
   - Rewrite each block so it describes what the founder gets clarity on during that part of the morning.
   - Keep it casual but valuable:
     - Check-in: settle in and get the idea out of your head
     - Foundation: turn the idea into a clear offer and audience
     - Strategy: make the first path to customers and revenue believable
     - Operations: map what has to happen after the workshop
     - Finance: understand pricing, costs, runway, and funding needs
     - Governance: know the risks, decisions, and support asks
     - Close: leave with next steps, not a pile of files

6. **What to bring**
   - Keep friendly tone, but tie each item to the value it unlocks.
   - Example: “A rough idea” becomes “A rough idea we can sharpen into an offer.”

7. **Calls to action**
   - Replace document-focused CTA language.
   - Suggested CTAs:
     - Primary: “Start my founder brief”
     - Secondary: “See what we build together” or “Preview the founder toolkit”

### Technical scope
- Update only frontend copy/presentation text.
- Primary files to revise:
  - `src/routes/_authenticated/dashboard/day.tsx`
  - `src/lib/workshop-mode.ts`
- No schema, workflow logic, authentication, pricing, routing, or layout changes.
- Preserve existing cohort-aware date/time behavior and keep copy day-agnostic.