## Refine Workshop Titles & Descriptions

Update the 8 BUILD_LAYER items in `src/lib/framework-deliverables.ts` to use the punchier, outcome-based titles from the screenshot. Rewrite each description to reinforce the new headline (what you walk out with), keeping the same tone, length, and brand voice as today.

### Title mapping (old → new)

| # | Old title | New title |
|---|---|---|
| 1 | Brand identity | Your brand in a day. No agency required. |
| 2 | A website that converts | Build the site your customers actually buy from. |
| 3 | Social presence | 30 days of content before you leave the room. |
| 4 | A content engine | Rank, publish, repeat. Your content machine is live. |
| 5 | AI as your operating system | Automate 5 real workflows. Today. |
| 6 | Email, CRM, and automation | 16 emails written. Your sales machine is running. |
| 7 | Sales systems | Walk out with a sales script that qualifies and closes. |
| 8 | Legal, financial, and operational scaffolding | Entity. Contracts. Books. Done. |

### Description refresh

Each description rewritten to ladder up to its new headline — concrete deliverable + why it matters — same one-to-two-sentence rhythm. Example:

- **Your brand in a day** — "Logo, palette, type system, and guidelines — finished before you leave. No agency retainer, no six-week wait, no committee."
- **Build the site your customers actually buy from** — "Not a brochure. A revenue surface wired to payments and analytics, written for the buyer you're actually trying to win."
- **30 days of content** — "A month of on-brand posts, captions, and hooks — drafted, scheduled, and ready to publish the morning after the workshop."
- **Rank, publish, repeat** — "An SEO-aware content engine with pillars, topics, and the next 90 days mapped — so traffic compounds instead of costing more every month."
- **Automate 5 real workflows** — "Five AI workflows wired into your actual operation — drafting, qualifying, follow-up, reporting, support — so two people do the work of ten."
- **16 emails, sales machine running** — "A 16-email nurture and follow-up sequence loaded into your CRM. Most revenue lives in the second, fifth, and twelfth touch — automated, on time, on brand."
- **Sales script that qualifies and closes** — "A repeatable script and pipeline that moves a stranger to a signed deal — with the objections, the asks, and the close already written."
- **Entity. Contracts. Books. Done.** — "LLC, EIN, operating agreement, client contracts, and a clean books setup — the boring scaffolding that keeps you legal, bankable, and ready to scale."

### Technical notes

- Single file edit: `src/lib/framework-deliverables.ts` (BUILD_LAYER array, lines ~190–239).
- `OUT_OF_SCOPE` alias at line 242 auto-derives from BUILD_LAYER titles — no extra change needed, but worth checking where it's consumed in case any UI shows it as a short label (likely safe; legacy alias).
- Icons stay the same.
- No DB or edge-function changes — these are presentation strings.
