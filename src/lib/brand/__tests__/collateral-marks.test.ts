import { describe, expect, it } from "vitest";
import { contentAllKey, contentWeekKey, socialAllKey, resolveStudioChoice, contentGraphicKey, recommendMark, slotChoices, slotsForKind, socialGraphicKey, studioChoiceFor, studioMarkKind, stylePreviewGraphicKey } from "../collateral-marks";

const full = [
  { form: "symbol", tone: "colour" },
  { form: "symbol", tone: "inverse" },
  { form: "horizontal", tone: "colour" },
  { form: "horizontal", tone: "inverse" },
  { form: "stacked", tone: "colour" },
  { form: "stacked", tone: "inverse" },
] as const;

const slot = (kind: string, id: string) => slotsForKind(kind).find((s) => s.id === id)!;

describe("mark slots", () => {
  it("gives a deck three distinct positions", () => {
    expect(slotsForKind("presentation").map((s) => s.id)).toEqual(["cover", "running", "closing"]);
  });

  it("falls back to one generic slot for an unknown kind", () => {
    expect(slotsForKind("mystery").map((s) => s.id)).toEqual(["primary"]);
  });
});

describe("recommendMark", () => {
  it("puts the symbol in running chrome and a lockup on the cover", () => {
    expect(recommendMark(slot("presentation", "running"), [...full])!.form).toBe("symbol");
    expect(recommendMark(slot("presentation", "cover"), [...full])!.form).not.toBe("symbol");
  });

  it("reverses the mark on a dark closing slide", () => {
    expect(recommendMark(slot("presentation", "closing"), [...full])!.tone).toBe("inverse");
  });

  it("prefers an axial mark where the slot is centred", () => {
    expect(recommendMark(slot("presentation", "closing"), [...full])!.form).toBe("stacked");
  });

  it("keeps colour artwork on paper", () => {
    expect(recommendMark(slot("business_card", "back"), [...full])!.tone).toBe("colour");
  });

  it("returns nothing when the venture supplied nothing", () => {
    expect(recommendMark(slot("letterhead", "header"), [])).toBeNull();
  });
});

describe("slotChoices", () => {
  it("reads a legacy flat cell as every slot", () => {
    const out = slotChoices("presentation", { requested: { form: "stacked", tone: "colour" } });
    expect(Object.keys(out)).toEqual(["cover", "running", "closing"]);
    expect(out.cover).toEqual({ form: "stacked", tone: "colour" });
  });

  it("reads a bare per-slot map straight from the picker", () => {
    const out = slotChoices("business_card", {
      front: { form: "stacked", tone: "colour" },
      back: { form: "stacked", tone: "colour" },
    });
    expect(out).toEqual({
      front: { form: "stacked", tone: "colour" },
      back: { form: "stacked", tone: "colour" },
    });
  });

  it("ignores keys that are not slots of this kind", () => {
    const out = slotChoices("business_card", {
      front: { form: "symbol", tone: "colour" },
      cover: { form: "stacked", tone: "inverse" },
    });
    expect(out).toEqual({ front: { form: "symbol", tone: "colour" } });
  });

  it("reads per-slot choices", () => {
    const out = slotChoices("presentation", {
      slots: { running: { form: "symbol", tone: "colour" } },
    });
    expect(out).toEqual({ running: { form: "symbol", tone: "colour" } });
  });
});

describe("studio surfaces", () => {
  it("creates stable, exact keys for each generated graphic", () => {
    expect(socialGraphicKey("LinkedIn", "banner", "editorial")).toBe("social:LinkedIn:banner:editorial");
    expect(contentGraphicKey("post-1", "4:5")).toBe("content:post-1:4%3A5");
    expect(stylePreviewGraphicKey("editorial")).toBe("style:editorial");
  });

  it("prefers an exact graphic choice and falls back to the legacy surface choice", () => {
    const choices = {
      studio_post: { form: "symbol", tone: "inverse" },
      "content:post-1:1%3A1": { form: "stacked", tone: "colour" },
    };
    expect(studioChoiceFor(choices, "content:post-1:1%3A1", "1:1")).toEqual({ form: "stacked", tone: "colour" });
    expect(studioChoiceFor(choices, "content:post-2:1%3A1", "1:1")).toEqual({ form: "symbol", tone: "inverse" });
  });

  it("inherits week then flight defaults before the legacy surface value", () => {
    const choices = {
      studio_post: { form: "symbol", tone: "inverse" },
      [contentAllKey("1:1")]: { form: "horizontal", tone: "colour" },
      [contentWeekKey(2, "1:1")]: { form: "stacked", tone: "colour" },
      [contentGraphicKey("post-1", "1:1")]: { form: "wordmark", tone: "colour" },
    };
    const inherit = (week: number) => [contentWeekKey(week, "1:1"), contentAllKey("1:1")];
    // exact wins
    expect(studioChoiceFor(choices, contentGraphicKey("post-1", "1:1"), "1:1", inherit(2)))
      .toEqual({ form: "wordmark", tone: "colour" });
    // week default
    expect(studioChoiceFor(choices, contentGraphicKey("post-9", "1:1"), "1:1", inherit(2)))
      .toEqual({ form: "stacked", tone: "colour" });
    // flight default
    expect(studioChoiceFor(choices, contentGraphicKey("post-9", "1:1"), "1:1", inherit(7)))
      .toEqual({ form: "horizontal", tone: "colour" });
    // legacy fallback when no batch default exists
    expect(studioChoiceFor(choices, contentGraphicKey("post-9", "4:5"), "4:5", [contentWeekKey(7, "4:5")]))
      .toEqual({ form: "symbol", tone: "inverse" });
    expect(resolveStudioChoice(choices, contentGraphicKey("post-9", "1:1"), "1:1", inherit(2)).source).toBe("inherited");
  });

  it("builds batch keys", () => {
    expect(contentWeekKey(3, "1:1")).toBe("content:week:3:1%3A1");
    expect(contentAllKey("4:5")).toBe("content:all:4%3A5");
    expect(socialAllKey("cover")).toBe("social:all:cover");
  });

  it("maps studio asset kinds onto slot sets", () => {
    expect(studioMarkKind("avatar")).toBe("studio_avatar");
    expect(studioMarkKind("profile_photo")).toBe("studio_avatar");
    expect(studioMarkKind("cover")).toBe("studio_cover");
    expect(studioMarkKind("linkedin_banner")).toBe("studio_cover");
    expect(studioMarkKind("9:16")).toBe("studio_story");
    expect(studioMarkKind("1:1")).toBe("studio_post");
  });

  it("gives every studio surface exactly one mark slot", () => {
    for (const kind of ["studio_avatar", "studio_cover", "studio_post", "studio_story"]) {
      expect(slotsForKind(kind)).toHaveLength(1);
      expect(slotsForKind(kind)[0].id).toBe("primary");
    }
  });

  it("recommends a full lockup for the avatar and a compact mark for a post corner", () => {
    const inventory = [
      { form: "symbol", tone: "colour" },
      { form: "stacked", tone: "colour" },
      { form: "stacked", tone: "inverse" },
      { form: "horizontal", tone: "inverse" },
    ] as any;
    const avatar = recommendMark(slotsForKind("studio_avatar")[0], inventory);
    // Square field on the brand colour: reversed lockup, never the bare symbol.
    expect(avatar?.tone).toBe("inverse");
    expect(avatar?.form).not.toBe("symbol");
    const post = recommendMark(slotsForKind("studio_post")[0], inventory);
    // Corner chrome on photography: the compact reversed mark.
    expect(post?.tone).toBe("inverse");
  });
});
