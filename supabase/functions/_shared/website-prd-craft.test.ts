import { describe, expect, it } from "vitest";
import { applyCraftContract, craftVerdict } from "./website-prd.ts";
import { buildAcceptanceChecklist, layoutContractBlock } from "./layout-contract.ts";

const LONG_GENERIC_PRD = `# Website PRD — Utah Claims Pros

## 3. Global Elements
Header with logo and nav. Footer with links. Cookie banner.

## 4. Page-by-Page Specs
### / — Home
Hero headline, sub-headline, and a call to action reading "Start your claim".

### /pricing — Pricing
Three packages described in prose.

<!-- BEGIN_MASTER_PROMPT -->
# AI Builder Brief — Utah Claims Pros Website

1) Role + outcome
${"word ".repeat(2000)}
11) Definition of Done

Begin scaffolding now. Generate all images on first run. Do not ask clarifying questions.
<!-- END_MASTER_PROMPT -->
`;

describe("craft contract", () => {
  it("fails a long but generic PRD", () => {
    const verdict = craftVerdict(LONG_GENERIC_PRD);
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.length).toBeGreaterThan(4);
  });

  it("injects the craft addendum even when the master prompt is already long", () => {
    const out = applyCraftContract(LONG_GENERIC_PRD, { companyName: "Utah Claims Pros" });
    expect(out).not.toBe(LONG_GENERIC_PRD);
    expect(out).toMatch(/Container primitive/i);
    expect(out).toMatch(/BUILD ACCEPTANCE CHECKLIST/);
    // The addendum lands inside the master prompt, before the closing line.
    const body = out.split("<!-- BEGIN_MASTER_PROMPT -->")[1].split("<!-- END_MASTER_PROMPT -->")[0];
    expect(body.trimEnd().endsWith("Do not ask clarifying questions.")).toBe(true);
  });

  it("is idempotent", () => {
    const once = applyCraftContract(LONG_GENERIC_PRD, {});
    const twice = applyCraftContract(once, {});
    expect(twice).toBe(once);
  });

  it("passes a PRD that carries the contract and the checklist", () => {
    const doc = `${LONG_GENERIC_PRD}\n\n${layoutContractBlock()}\n\n${buildAcceptanceChecklist()}`;
    const verdict = craftVerdict(doc);
    expect(verdict.failures).toEqual([]);
    expect(verdict.ok).toBe(true);
  });
});
