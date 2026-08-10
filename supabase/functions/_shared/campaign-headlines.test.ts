import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CAMPAIGN_ARC_VERSION,
  campaignInputFingerprint,
  isUsableArc,
  normalizeCampaignArc,
} from "./campaign-arc.ts";
import { headlineConflict } from "./poster-copy.ts";

Deno.test("campaign arcs require the current version and input fingerprint", () => {
  assertEquals(isUsableArc({ weeks: [{ stage: "disrupt" }] }), false);
  assertEquals(isUsableArc({
    version: CAMPAIGN_ARC_VERSION,
    input_fingerprint: "v2-test",
    weeks: [{ stage: "disrupt" }],
  }), true);
});

Deno.test("cached arcs are normalized to the positional stage ladder", () => {
  const arc = normalizeCampaignArc({
    weeks: [
      { week: 1, stage: "urgency", claim: "First", proof: "One" },
      { week: 2, stage: "urgency", claim: "Second", proof: "Two" },
    ],
    offer: {},
  }, [1, 2], "v2-input");
  assertEquals(arc.weeks.map((week) => week.stage), ["disrupt", "reframe"]);
  assertEquals(arc.input_fingerprint, "v2-input");
});

Deno.test("calendar changes produce a different campaign fingerprint", () => {
  const first = campaignInputFingerprint([1], [{ week: 1, hook: "First claim" }]);
  const second = campaignInputFingerprint([1], [{ week: 1, hook: "Changed claim" }]);
  assertEquals(first === second, false);
});

Deno.test("headline gate catches launch-line adjective swaps", () => {
  const conflict = headlineConflict(
    "Launch 15 fresh ad variants in 30 days",
    ["Launch 15 ad variants in 30 days"],
  );
  assertExists(conflict);
});

Deno.test("headline gate catches recycle and delay synonym swaps", () => {
  const conflict = headlineConflict(
    "Every rerun delays fresh customer-led ads",
    ["Recycling ads delays customer-led replacements"],
  );
  assertExists(conflict);
});

Deno.test("headline gate permits a genuinely different campaign argument", () => {
  const conflict = headlineConflict(
    "Authorized customer accounts cut four vendor handoffs",
    ["Launch 15 ad variants in 30 days"],
  );
  assertEquals(conflict, null);
});