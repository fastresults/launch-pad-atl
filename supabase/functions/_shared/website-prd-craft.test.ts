import { describe, expect, it } from "vitest";
import {
  applyCraftContract,
  craftVerdict,
  imageryRowsParsed,
  routesInSpec,
} from "./website-prd.ts";
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

const IMAGERY_HEADER =
  `| Route | Section | Slot name | Visual type | Aspect ratio | Treatment | Exposure & contrast target | Text-overlay plan | Parallax plan | Caption / on-page copy | Narrative role | Alt text | Generation prompt |\n` +
  `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`;

function row(route: string, i: number, type = "spot call-out"): string {
  const hero = /hero|full-bleed/.test(type);
  const exposure = hero
    ? "subject at 35–55% luminance, open shadows"
    : "subject at 45–60% luminance";
  const overlay = hero
    ? "CSS gradient scrim left-to-right, left third stays clean, never baked into the render"
    : "no type on image";
  const parallax = hero ? "plate 0.25x / midground 0.6x / type 1.0x, static under prefers-reduced-motion" : "static";
  return `| ${route} | Section ${i} | Slot ${i} | ${type} | 16:9 | ${hero ? "full-bleed" : "inset"} | ${exposure} | ${overlay} | ${parallax} | "We answer in an hour." | Adjusters answer every claim within the hour. | Alt text ${i} | google/gemini-3-pro-image, 3840x2160, editorial photograph #0055A4 #EF4135 |`;
}

function imageryTable(): string {
  const lines = [IMAGERY_HEADER];
  for (let i = 1; i <= 8; i++) lines.push(row("/", i, i === 1 ? "hero" : "spot call-out"));
  for (let i = 1; i <= 4; i++) lines.push(row("/pricing", i, i === 1 ? "hero" : "product-UI"));
  return lines.join("\n");
}

const ROUTE_SPECS = `## 4. Page-by-Page Specs
### / — Home
Hero with a background plate running the three-plane parallax stack — plate 0.25x, midground 0.6x, type 1.0x — collapsing to a static composition under prefers-reduced-motion. Adjusters answer every claim within the hour.

### /pricing — Pricing
Full-bleed band with a two-plane parallax treatment. Tiers carry a price and a CTA.
`;

/** A document that satisfies every check, used as the pass fixture. */
const GOOD_PRD = `# Website PRD — Utah Claims Pros

## 3. Global Elements
${layoutContractBlock()}

${ROUTE_SPECS}

## 4b. Imagery Plan & Art Direction
${imageryTable()}

## 5. Motion
Parallax depth stack at 0.25x with a prefers-reduced-motion fallback. Display face preloaded on a 1.250 modular scale with clamp(2.75rem, 6vw, 7rem) and tracking -0.02em; opacity ladder 100% / 72% / 56% / 38%. Images are generated on google/gemini-3-pro-image at 1920 wide.

<!-- BEGIN_MASTER_PROMPT -->
# AI Builder Brief

1) Role + outcome
${"word ".repeat(2000)}
11) Definition of Done

Begin scaffolding now. Generate all images on first run. Do not ask clarifying questions.
<!-- END_MASTER_PROMPT -->

${buildAcceptanceChecklist()}
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

  it("does not let the injected addendum satisfy the imagery and motion checks", () => {
    // Regression: these checks used to grep the whole document, so our own
    // addendum made them pass on a PRD with no imagery table at all.
    const injected = applyCraftContract(LONG_GENERIC_PRD, { companyName: "Utah Claims Pros" });
    const ids = craftVerdict(injected).checks.filter((c) => !c.ok).map((c) => c.id);
    expect(ids).toContain("parallax_hero");
    expect(ids).toContain("hero_exposure");
    expect(ids).toContain("image_density");
    expect(ids).toContain("image_copy");
    expect(ids).toContain("image_tier");
  });

  it("reads routes and imagery rows out of the authored sections", () => {
    expect(routesInSpec(GOOD_PRD).sort()).toEqual(["/", "/pricing"]);
    const rows = imageryRowsParsed(GOOD_PRD);
    expect(rows.filter((r) => r.route === "/")).toHaveLength(8);
    expect(rows.filter((r) => r.route === "/pricing")).toHaveLength(4);
    expect(rows[0].caption).toContain("We answer");
  });

  it("fails a PRD whose home route is under the image density floor", () => {
    const thin = GOOD_PRD.replace(row("/", 8), "").replace(row("/", 7), "");
    const ids = craftVerdict(thin).checks.filter((c) => !c.ok).map((c) => c.id);
    expect(ids).toContain("image_density");
  });

  it("fails a hero row that asks for a dark render with no exposure target", () => {
    const dark = GOOD_PRD.replace(
      "subject at 35–55% luminance, open shadows",
      "moody near-black interior",
    );
    const ids = craftVerdict(dark).checks.filter((c) => !c.ok).map((c) => c.id);
    expect(ids).toContain("hero_exposure");
    expect(ids).toContain("no_baked_darkening");
  });

  it("passes a PRD that carries the contract, the imagery table and the checklist", () => {
    const verdict = craftVerdict(GOOD_PRD);
    expect(verdict.failures).toEqual([]);
    expect(verdict.ok).toBe(true);
  });
});
