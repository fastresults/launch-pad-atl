
## The frame

Twenty strategy deliverables. All included with the $97 workshop. Every label written like a conversion copywriter who knows the founder is one swipe away from closing the tab.

Rules I'm holding myself to:

- **≤6 words per label.** Scannable, not skimmable.
- **Second person, present tense.** "Your," not "the."
- **End on the win, not the artifact.** Not "Business Plan Generator." A business plan an investor will actually read.
- **No hedging, no hype.** "Premium pricing," not "potentially premium pricing." But also no "bulletproof" inside labels — it's a tell.
- **Sentence rhythm matters.** Reading 20 in a row should feel like a drumbeat, not a grocery list.

## The 20 deliverables — final copy

### Stage 1 · Build your unshakeable foundation
*Five deliverables. The bedrock every defensible startup is built on.*

1. **Your idea, sharpened into a thesis** *(Concept Brief)*
2. **A vision people want to follow** *(Vision & Mission)*
3. **Legally airtight from day one** *(Legal Checklist)*
4. **A brand worth premium pricing** *(Brand Builder)*
5. **Your business model, on one page** *(Business Model Canvas)*

### Stage 2 · Craft your winning strategy
*Five deliverables. The strategic edge competitors will spend years trying to copy.*

6. **The gap your competitors left open** *(Competitive Analysis)*
7. **Prices your customers gladly pay** *(Pricing & Packaging)*
8. **An investor-ready business plan** *(Business Plan)*
9. **Your market, sized and decoded** *(Market Analysis)*
10. **Numbers that survive investor scrutiny** *(Financial Projections)*

### Stage 3 · Launch with professional power
*Ten deliverables. Everything you need to go from plan to paying customers.*

11. **A launch the market notices** *(Launch Plan)*
12. **Social channels ready to fire** *(Social Launch)*
13. **Website copy that actually sells** *(Website Copy)*
14. **Marketing that owns your category** *(Marketing Strategy)*
15. **A repeatable, scalable sales system** *(Sales Strategy)*
16. **Your customer, understood inside-out** *(Customer Research)*
17. **A product customers can't put down** *(Product Development)*
18. **Operations that run without you** *(Operations Plan)*
19. **A funding plan investors respect** *(Funding Strategy)*
20. **Growth tactics that compound fast** *(Growth Hacking)*

## Supporting copy that has to move with it

If 20 deliverables now ship with $97, the surrounding sentences need to back the claim or the page snaps. Updates:

### `src/components/home/HomeFramework.tsx`

- **Hero subhead** — currently sells "six things." Rewrite: *"Twenty strategy deliverables a consultant would charge $50,000+ for. You get every one of them in a morning, for $97. No upsell in the room."*
- **Framework section headline** — keep "Your complete strategic foundation. Built in one room, in one morning." Still earns it.
- **Framework section intro** — *"Twenty deliverables across three stages. Each one built live for your idea, not pulled from a template. Consultants charge $50,000+ to produce this stack. You pay $97."*
- **InOutScope "Included" list** — replace the 6 hand-written items with: *"All 20 strategy deliverables across foundation, strategy, and launch · Built live with Adam · Yours to keep forever · Coffee and light refreshments throughout."*

### `src/lib/framework-deliverables.ts`

- Replace `FRAMEWORK_DELIVERABLES` (flat 6) with `FRAMEWORK_STAGES` — three stages, each with `name`, `intro`, and an `items` array of `{ icon, title }`.
- Export `FRAMEWORK_DELIVERABLES` as a flat alias of all 20 titles so `RegisterFramework.tsx` doesn't break.
- Add 14 new lucide icons mapped sensibly (Scale, Palette, BarChart3, Target, DollarSign, FileText, Megaphone, Rocket, Share2, PenTool, TrendingUp, Search, Package, Settings, Banknote, Zap — final mapping at edit time).

### Home Framework layout

- Three stacked stage blocks instead of one flat grid.
- Each block: small stage number ("01"), stage headline, intro line, then a 2-column outcome list — icon + 6-word label per row.
- Stage 3 (10 items) gets a slightly denser grid so it doesn't dominate the page.

### `src/components/register/RegisterFramework.tsx`

- Sidebar can't show 20 lines without becoming a wall. Collapse to:
  *"What you walk out with"* → three lines, one per stage, with the deliverable count and a one-liner. ("Stage 1 · Foundation — 5 deliverables · Your business, built right.") Full 20 stays on the home page where it has room to breathe.

### `src/routes/services.tsx` workshop credit line

- Change "Get the plan first" → *"Get all 20 deliverables first. If you decide our team is the right fit to build it, we'll knock the $97 off any project over $1,000."*

## One credibility flag — read before approving

You're putting 20 strategy deliverables behind a $97, ~3-hour workshop. The copy can absolutely sell it — that's what I'm here for. But a sharp founder will do the math: $4.85 per deliverable, ~8 minutes each. Two ways to handle it cleanly so the offer doesn't read as too-good-to-be-true:

- **(a) "Built live" framing.** Hold the line that the workshop produces all 20, structured templates filled in live with Adam guiding. The copy above already leans this way.
- **(b) "Yours to keep, then refined together."** Workshop produces draft v1 of all 20; structured follow-ups in the weeks after refine them. More defensible, slightly less punchy.

I've written the labels and supporting copy to fit **(a)**. Say the word if you want me to soften toward (b).

## Out of scope

- Schedule page timeline edits (separate pass once we lock the framing)
- Pricing changes
- Services page packages
- Any icon/visual design beyond the lucide swap-in
