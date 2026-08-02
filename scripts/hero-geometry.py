"""Desktop hero geometry regression gate.

Usage: python3 scripts/hero-geometry.py [base URL]
Defaults to the local Vite preview. Exits non-zero on any geometry drift.
"""

import asyncio
import json
import sys
from urllib.parse import urljoin

from playwright.async_api import async_playwright


BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
VIEWPORTS = ((1000, 800), (1280, 720), (1576, 1043), (1920, 1080))
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


def near(actual, expected, tolerance=1):
    return abs(actual - expected) <= tolerance


async def main():
    failures = []
    report = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width, height in VIEWPORTS:
            context = await browser.new_context(
                viewport={"width": width, "height": height}, device_scale_factor=1
            )
            page = await context.new_page()
            await page.goto(
                urljoin(BASE_URL, f"/?geometry-check={width}x{height}"),
                wait_until="networkidle",
            )
            values = await page.evaluate(
                """(selectors) => {
                  const output = {
                    appVersion: document.querySelector('meta[name="app-version"]')?.content,
                    assets: [...document.querySelectorAll('link[rel="stylesheet"], script[src]')]
                      .map((element) => element.href || element.src).filter(Boolean),
                    rootFont: getComputedStyle(document.documentElement).fontSize,
                  };
                  for (const [key, selector] of Object.entries(selectors)) {
                    const matches = [...document.querySelectorAll(selector)];
                    if (matches.length !== 1) {
                      output[key] = { count: matches.length };
                      continue;
                    }
                    const element = matches[0];
                    const rect = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    output[key] = {
                      count: 1, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                      fontSize: parseFloat(style.fontSize), display: style.display,
                      transform: style.transform, zoom: style.zoom,
                    };
                  }
                  return output;
                }""",
                SELECTORS,
            )
            report.append({"viewport": [width, height], **values})

            for key in SELECTORS:
                if values[key].get("count") != 1:
                    failures.append(f"{width}x{height}: expected one {key}")
            if failures and any(f.startswith(f"{width}x{height}:") for f in failures):
                await context.close()
                continue

            expected = {
                "header": (None, 52, None),
                "logo": (165, 32, None),
                "title": (598, 45, 42),
                "prompt": (800, 152, None),
                "input": (750, 35, 18),
                "submit": (150, 42, 13),
            }
            for key, (target_width, target_height, target_font) in expected.items():
                value = values[key]
                if target_width is not None and not near(value["width"], target_width):
                    failures.append(f"{width}x{height}: {key} width {value['width']:.1f} != {target_width}")
                if not near(value["height"], target_height):
                    failures.append(f"{width}x{height}: {key} height {value['height']:.1f} != {target_height}")
                if target_font is not None and not near(value["fontSize"], target_font, 0.1):
                    failures.append(f"{width}x{height}: {key} font {value['fontSize']:.1f} != {target_font}")
                if value["zoom"] != "1" or value["transform"] != "none":
                    failures.append(f"{width}x{height}: {key} has scale/zoom")

            if values["desktop_nav"]["display"] == "none":
                failures.append(f"{width}x{height}: desktop navigation hidden")
            if values["mobile_nav"]["display"] != "none":
                failures.append(f"{width}x{height}: mobile navigation visible")
            if not near(values["stack"]["x"] + values["stack"]["width"] / 2, width / 2):
                failures.append(f"{width}x{height}: stack not centered")
            if values["stack"]["transform"] != "none" or values["stack"]["zoom"] != "1":
                failures.append(f"{width}x{height}: stack has scale/zoom")
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