# Remove AI-tool language from everything the founder sees

Founders should never be told to go run AI tools. AI stays behind the scenes as how Adam's team works. Every founder-facing surface gets rewritten to talk about the actual business outcome and the tools a real operator uses.

## 1. The tool stack becomes an Operating Tool Stack

The "AI toolkit / AI stack" asset stays, but is reframed and renamed:

- Asset name: "Your operating tool stack, picked for you" — the named tools for CRM, scheduler, books, email, site, analytics, support, reviews, ads. Descriptions drop "AI-first".
- Hub panel: "AI Toolkit" heading, "Generate my AI Stack" button, and the "02 · AI Toolkit" section eyebrow all become "Operating Tool Stack" / "Set up my tool stack".
- Generation prompt is rewritten to pick real business software (no "AI-first stack", no model-picking guidance, no "store these in ChatGPT/Claude projects" section).

## 2. Prompt library retires from the founder view

The "25 ready-to-use AI prompts" asset is turned off as a founder deliverable. Where the 14-day plan referenced it, the day's outcome becomes the offer sheet and messaging work instead — nothing about "25 tuned prompts". The "AI helper for easy questions" support-bot asset becomes a plain "support inbox and FAQ setup" item with no AI framing.

## 3. 14-day plan and the Operationalize runway

- Day 1 objective/done-when stop saying "pick your AI toolkit" / "committed to your AI stack" — they become "lock the story and the tools you'll run on".
- The `ai-stack` runway step becomes "Set up your operating tools", with a how-to guide that names accounts, business email, and password manager — no AI tools.
- Day-2 language about prompt libraries is replaced with offer and messaging outcomes.
- Guidance/pitfall copy referencing the AI stack is rewritten.

## 4. Dashboard and brief copy

"Your AI assistant" phrasing in the dashboard, brief status, brief review, and brief-complete cards becomes "your build" / "our team" / "Startup Labs". Studio helper text that tells the founder to "ask the AI" becomes plain action language ("Draft next week's posts"). System error strings about credits become neutral ("Generation is paused — our team has been notified").

## 5. Marketing site and workshop catalog

- The **Run on AI** workshop (`ai-operating-system`) is retired: removed from the workshop catalog, pains, audit, schedule, product pages, and the agency-services list and bundles. Its route redirects to the workshops index so no link 404s.
- Bundles that included it are re-composed from the remaining workshops.
- Remaining workshop copy loses AI-tool references: "AI stack audit", "prompt library", "Buying ChatGPT seats", Midjourney/Canva mentions, and the "same AI stack Adam ships with" audience line — each replaced with outcome language.
- Adam's bio keeps his AI credentials (that's his expertise, not something the founder must operate) but drops any "here's the toolchain you'll use" framing.
- Chatbot knowledge base is updated so the assistant never recommends AI tools, prompt libraries, or the retired workshop.

## Technical notes

- Copy and catalog edits: `src/lib/build-workshops.ts`, `workshop-catalog.ts`, `workshop-products.ts`, `workshop-pains.ts`, `workshop-audit.ts`, `build-workshop-schedule.ts`, `agency-services.ts`, `framework-deliverables.ts`, `hub-dashboard-copy.ts`, `launch-14day-plan.ts`, `launch-14day-guidance.ts`, `chatbot-knowledge.ts`, `asset-tracks.ts`.
- Components: `AIStackPanel.tsx` (renamed to `ToolStackPanel.tsx`), `BriefStatusCard.tsx`, `BriefReview.tsx`, `BriefCompleteCard.tsx`, `dashboard/index.tsx`, `ContentStudio.tsx`, `ConceptStudio.tsx`, `FacilitatorAudience.tsx`.
- Edge functions: `_shared/deliverable-prompts.ts` (tool-stack prompt rewrite, prompt-library prompt removed, image-prompt sections stop naming Midjourney/Ideogram in founder-visible output), `_shared/ops-runway.ts`, `_shared/ops-guides.ts`, `_shared/launch-14day-plan.ts`, `venture-chatbot/knowledge.ts`.
- Database: one migration updating `venture_document_types` — rename/redescribe `ai_tool_stack_recommendation`, deactivate `ai_prompt_library`, reword `ai_support_bot_setup`. Keys stay unchanged so existing generated assets and history keep working.
- A repo-wide grep check at the end confirms no founder-facing string still says AI tool, AI stack, AI toolkit, AI assistant, ChatGPT, Claude, Midjourney, or Ideogram.

---

# Addition: heavy-lifting milestones on the decision gate

At the point where the founder chooses self-build vs. Adam's team, add a **"The heavy lifting"** block between the mode cards and the cost comparison.

- Pull the real milestone tasks from the runway (the ones already marked Milestone / Agency-led) and group them into 6–8 named heavy lifts: entity + compliance, books and payments, brand and creative sign-off, the live site, CRM and funnels, campaign launch, operating rhythm.
- Each lift shows one line of what it actually takes (e.g. "GoHighLevel sub-account, A2P registration, 4 pipelines, 12 automations"), the hour range, and the skill it demands.
- Two columns, same milestones on both sides: **You do it** shows what the founder must learn, source, and own (tools to buy, specialists to hire, hours off the business). **We do it** shows it as done, with the named specialist role and the delivered artifact.
- A short closing line ties it to the numbers already on screen — same scope, one side costs hours and learning curve, the other is a fixed retainer.

Concise, no hype: the contrast does the selling. Built as a new `HeavyLifting.tsx` in `src/components/ops/`, fed by the existing significance/leadership helpers, rendered inside the gate above `InvestmentCompare`.
