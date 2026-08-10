import { describe, expect, it } from "vitest";
import { buildPreviewCopy } from "./preview-copy";

const image = {
  url: "https://example.test/a.png",
  label: "fallback label",
  width: 1080,
  height: 1080,
  meta: {
    platform: "LinkedIn / Facebook",
    day: "Wednesday",
    week: 4,
    pillar: "Educational (Best Practices)",
    aspect: "1:1",
    headline: "Give great content the reach it deserves",
    hook: "Are you struggling to bridge the gap?",
    body: "Many brands invest heavily in creating content.",
    cta: "Learn how we maximize your content's reach!",
    hashtags: ["UGCStrategy", "ContentSyndication"],
  },
} as any;

describe("buildPreviewCopy", () => {
  it("exposes every ad copy field for the preview modal", () => {
    const c = buildPreviewCopy(image, "Campaign week 4");
    expect(c.eyebrow).toBe("LinkedIn / Facebook · Week 4 · Wednesday · 1:1");
    expect(c.headline).toBe("Give great content the reach it deserves");
    expect(c.pillar).toBe("Educational (Best Practices)");
    expect(c.fields.map((f) => f.id)).toEqual(["headline", "hook", "body", "cta", "tags"]);
    expect(c.caption).toContain("Many brands invest heavily");
    expect(c.caption).toContain("UGCStrategy ContentSyndication");
    expect(c.artworkOnly).toBe(false);
  });

  it("still shows a headline and says so when a creative has no post copy", () => {
    const c = buildPreviewCopy({ url: "u", label: null, meta: null } as any, "Brand logo");
    expect(c.headline).toBe("Brand logo");
    expect(c.fields).toHaveLength(1);
    expect(c.artworkOnly).toBe(true);
  });

  it("does not repeat the hook when it matches the headline", () => {
    const c = buildPreviewCopy(
      { url: "u", meta: { headline: "Same line", hook: "Same line", body: "Body" } } as any,
      "x",
    );
    expect(c.fields.map((f) => f.id)).toEqual(["headline", "body"]);
  });
});
