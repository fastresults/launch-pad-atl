# Hand off to Startup Labs: a real price page from the share link

Today a founder can flip the runway to "Startup Labs builds it," but nothing tells them what that costs or how to actually start. This adds a dedicated engagement page they can open straight from the showcase (and from the hub), with a flat monthly price, exactly what the retainer covers for *their* runway, and two ways to sign up.

## Where it lives

A public page tied to the share token: `/v/:token/engage`. No login. It loads the same share payload and runway the showcase uses, so the page speaks in the founder's own venture name, and quotes their real step counts.

Entry points:
- Retained card in the featured delivery band — "See the price and start" (both share link and hub).
- Compare view (`InvestmentCompare`) — retained column CTA.
- Operationalize dashboard header — a quiet "Hand it to Startup Labs" link when mode is self.
- Hub version links to the same page with the venture's active share token.

## What the page says

1. **Masthead** — "Your foundation is built. Hand the runway to the team that built it." Venture name, logo, Phase 2 of 2 framing consistent with the ops header.
2. **The price band** — one flat monthly retainer, stated plainly: what it is per month, what the minimum term is, what happens if they stop. No hourly billing, no surprise invoices.
3. **What we own** — pulled live from their runway: the N specialist steps, grouped by the milestone clusters already used in Heavy Lifting (offer, legal, money, sales, run, rhythm, growth). Each line shows a named owner and a committed date promise.
4. **What stays with you** — approvals, the calls only they can make, so the retainer never feels like losing control.
5. **Not included / priced separately** — platform builds from $3,750 (reuses the existing `PLATFORM_COPY` constants) and anything already delivered in the foundation.
6. **Two ways to start**
   - *Book the kickoff call* (primary): short intake form — name, email, phone, what they want moving first — posts to a new engagement endpoint, emails Adam, then shows the scheduling link.
   - *Start now with a deposit* (secondary): pay the first month online and skip the queue.
7. **Reassurance strip** — same crew that built the foundation, cancel with notice, everything they own stays theirs.

## Phasing

**Phase 1 — page, pricing, intake (no payment).** Build the route, pricing constants, live runway coverage, intake form + email notification, and every entry point. Deposit button present but shown as "Book the call to start" until Phase 2 lands.

**Phase 2 — deposit checkout.** Enable payments, create the monthly retainer product, and wire the secondary CTA to checkout with the venture token in metadata so the signed order lands against the right venture. Marking the venture as retained on successful payment.

## Open item

The plan needs one number: the monthly retainer figure and minimum term (for example "$4,500/mo, 90-day minimum, cancel with 30 days' notice"). It will live in a single constant so it can be changed in one place — tell me the figure and I'll set it; otherwise I'll ship with that placeholder clearly marked.

## Technical notes

- New route `src/routes/v.$token.engage.tsx`, rendered outside the showcase reading pane but sharing its dark editorial theme.
- New `src/lib/ops-engagement.ts` — retainer price, term, inclusions copy, all in one place (mirrors how `ops-platform.ts` holds the platform floor price).
- New component set under `src/components/ops/engage/` — `EngagePricePanel`, `EngageCoverage`, `EngageIntakeDialog`.
- Coverage counts derive from the existing runway fetch (`fetchOpsRunway` with share auth) plus the milestone clustering in `ops-significance.ts` — no new task data.
- `supabase/functions/venture-ops` gains a `request_engagement` action: validates the share token, stores the request, and emails Adam via the same Resend path `share-consult-request` uses.
- Copy follows the standing rules: done-with-you, "your startup", no plan/blueprint language, no founder-facing AI tooling.
