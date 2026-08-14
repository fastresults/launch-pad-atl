import { describe, expect, it } from "vitest";
import { recommendMark, slotChoices, slotsForKind } from "../collateral-marks";

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

  it("recommends a centred axial lockup for avatars and a compact mark for posts", () => {
    const inventory = [
      { form: "symbol", tone: "colour" },
      { form: "stacked", tone: "colour" },
      { form: "horizontal", tone: "inverse" },
    ] as any;
    const avatar = recommendMark(slotsForKind("studio_avatar")[0], inventory);
    expect(avatar?.form).toBe("stacked");
    const post = recommendMark(slotsForKind("studio_post")[0], inventory);
    expect(post?.form).toBe("horizontal");
  });
});
