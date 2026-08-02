"""Desktop hero composition regression gate.

Usage: python3 scripts/hero-geometry.py [base URL]

Asserts PROPORTIONS (share of viewport width), not absolute pixels. A frozen
pixel size passes at one width and looks magnified at every narrower one —
that failure mode is exactly what this gate exists to catch.
"""

import asyncio
import json
from pathlib import Path
import sys
from urllib.parse import urljoin

from playwright.async_api import async_playwright


BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
WIDTHS = (1024, 1190, 1200, 1280, 1400, 1576, 1920)
SCREENSHOT_DIR = Path("/tmp/hero-geometry")

# selector -> (min % of viewport width, max % of viewport width)
RATIO_TARGETS = {
    ".sl-hero__title": (24.0, 34.0),
    ".sl-prompt__panel": (40.0, 47.0),
}
SELECTORS = {
    "header": ".sl-site-header",
    "logo": ".sl-site-header__logo",
    "hero": ".sl-hero",
    "stack": ".sl-hero__stack",
    "title": ".sl-hero__title",
    "prompt": ".sl-prompt__panel",
    "input": ".sl-prompt__input",
    "submit": ".sl-prompt__submit",
    "desktop_nav": ".sl-site-header__nav",
    "mobile_nav": ".sl-site-header__mobile",
    "scene": '.sl-hero__scene[data-active="true"]',
}


async def main():
    failures = []
    report = []
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    cases = [(width, 900, 1) for width in WIDTHS]
    cases.append((1576, 1043, 1.8))
    cases.append((1000, 900, 1.8))

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width, height, dpr in cases:
            context = await browser.new_context(
                viewport={"width": width, "height": height}, device_scale_factor=dpr
            )
            page = await context.new_page()
            await page.goto(
                urljoin(BASE_URL, f"/?geometry-check={width}x{height}"),
                wait_until="domcontentloaded",
            )
            await page.wait_for_selector(".sl-hero", state="visible", timeout=20_000)

            values = await page.evaluate(
                """(selectors) => {
                  const output = {
                    htmlVersion: document.querySelector('meta[name="app-version"]')?.content,
                    runtimeVersion: document.documentElement.dataset.appVersion,
                    rootFont: getComputedStyle(document.documentElement).fontSize,
                  };
                  for (const [key, selector] of Object.entries(selectors)) {
                    const matches = [...document.querySelectorAll(selector)];
                    if (matches.length !== 1) {
                      output[key] = { count: matches.length, selector };
                      continue;
                    }
                    const element = matches[0];
                    const rect = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    output[key] = {
                      count: 1, selector,
                      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                      fontSize: parseFloat(style.fontSize), display: style.display,
                      transform: style.transform, zoom: style.zoom,
                    };
                  }
                  return output;
                }""",
                SELECTORS,
            )
            label = f"{width}x{height}@{dpr:g}x"
            ratios = {
                key: round(value["width"] / width * 100, 1)
                for key, value in values.items()
                if isinstance(value, dict) and value.get("count") == 1
            }
            report.append({"viewport": [width, height], "dpr": dpr, "ratios": ratios, **values})

            missing = [k for k in SELECTORS if values[k].get("count") != 1]
            if missing:
                failures.append(f"{label}: expected exactly one of {missing}")
                await context.close()
                continue

            for key, value in values.items():
                if not isinstance(value, dict) or value.get("count") != 1:
                    continue
                selector = value["selector"]
                if selector in RATIO_TARGETS:
                    low, high = RATIO_TARGETS[selector]
                    ratio = value["width"] / width * 100
                    if not (low <= ratio <= high):
                        failures.append(
                            f"{label}: {key} occupies {ratio:.1f}% of width (want {low}-{high}%)"
                        )
                # the background scene owns the Ken Burns drift transform
                if key != "scene" and (value["zoom"] != "1" or value["transform"] != "none"):
                    failures.append(f"{label}: {key} has scale/zoom")


            if values["header"]["height"] > 60:
                failures.append(f"{label}: header {values['header']['height']:.0f}px too tall")
            if values["desktop_nav"]["display"] == "none":
                failures.append(f"{label}: desktop navigation hidden")
            if values["mobile_nav"]["display"] != "none":
                failures.append(f"{label}: mobile navigation visible")
            if abs(values["stack"]["x"] + values["stack"]["width"] / 2 - width / 2) > 1:
                failures.append(f"{label}: stack not centered")
            if values["prompt"]["y"] + values["prompt"]["height"] > height:
                failures.append(f"{label}: prompt panel overflows the viewport")
            if values["title"]["fontSize"] > 40:
                failures.append(f"{label}: hero title {values['title']['fontSize']:.0f}px is oversized")
            if values["prompt"]["height"] > 145:
                failures.append(f"{label}: prompt panel {values['prompt']['height']:.0f}px is too tall")

            await page.screenshot(
                path=str(SCREENSHOT_DIR / f"hero-{label.replace('@', '-')}.png")
            )
            await context.close()
        await browser.close()

    print(json.dumps(report, indent=2))
    if failures:
        print("\nGEOMETRY GATE FAILED", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        raise SystemExit(1)
    print("\nGEOMETRY GATE PASSED")


asyncio.run(main())
