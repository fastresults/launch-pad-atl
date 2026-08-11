import { describe, expect, it } from "vitest";
import { stripEmbeddedMarkup } from "@/lib/strip-embedded-markup";

describe("stripEmbeddedMarkup", () => {
  it("removes the leaked style + font link preamble", () => {
    const md = [
      '<style> :root { --bg: #F5F5F5; --fg: #212121; --accent: #4285F4; } </style> <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">',
      "# The National Scope and the Local Stronghold",
      "",
      "The masonry sector is overdue for intervention.",
    ].join("\n");
    const out = stripEmbeddedMarkup(md);
    expect(out).not.toMatch(/<style|<link|fonts\.googleapis|--bg/);
    expect(out.startsWith("# The National Scope")).toBe(true);
  });

  it("removes an unclosed style tag line", () => {
    expect(stripEmbeddedMarkup("<style>\n# Title")).toBe("# Title");
  });

  it("keeps markup inside fenced code blocks", () => {
    const md = ["## Fonts", "", "```html", '<link rel="stylesheet" href="x.css">', "```"].join("\n");
    expect(stripEmbeddedMarkup(md)).toContain('<link rel="stylesheet"');
  });

  it("drops a stranded fonts URL but keeps real links", () => {
    expect(stripEmbeddedMarkup("See https://fonts.googleapis.com/css2?family=Inter now")).toBe(
      "See  now",
    );
    expect(stripEmbeddedMarkup("[Fonts](https://fonts.googleapis.com/x)")).toContain("fonts.googleapis");
  });

  it("leaves clean prose untouched", () => {
    const md = "# Title\n\nA paragraph with a <b>bold</b> tag.";
    expect(stripEmbeddedMarkup(md)).toBe(md);
  });
});
