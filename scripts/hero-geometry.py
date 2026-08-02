"""Desktop hero geometry regression gate.

Usage: python3 scripts/hero-geometry.py [base URL]
Defaults to the local Vite preview. Exits non-zero on any geometry drift.
"""

import asyncio
import json
from pathlib import Path
import sys
from urllib.parse import urljoin

from playwright.async_api import async_playwright


BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
VIEWPORTS = ((1000, 800), (1280, 720), (1576, 1043), (1920, 1080))
DPRS = (1, 1.8)
SCREENSHOT_DIR = Path("/tmp/hero-geometry")
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
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        cases = [(*viewport, 1) for viewport in VIEWPORTS]
        cases.append((1576, 1043, DPRS[1]))
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
            deployed_version = await page.evaluate(
                """async () => {
                  const response = await fetch(`/?_geometry_version=${Date.now()}`, {
                    cache: 'no-store', headers: { Accept: 'text/html' }
                  });
                  const html = await response.text();
                  return html.match(/<meta\\s+name=["']app-version["']\\s+content=["']([^"']+)["']/i)?.[1] ?? null;
                }"""
            )
            values = await page.evaluate(
                """(selectors) => {
                  const output = {
                    htmlVersion: document.querySelector('meta[name="app-version"]')?.content,
                    runtimeVersion: document.documentElement.dataset.appVersion,
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
            label = f"{width}x{height}@{dpr:g}x"
            report.append({"viewport": [width, height], "dpr": dpr,
                           "deployedVersion": deployed_version, **values})

            versions = (values.get("htmlVersion"), values.get("runtimeVersion"), deployed_version)
            if len(set(versions)) != 1 or None in versions:
                failures.append(f"{label}: build version mismatch {versions}")

            for key in SELECTORS:
                if values[key].get("count") != 1:
                    failures.append(f"{label}: expected one {key}")
            if failures and any(f.startswith(f"{label}:") for f in failures):
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
                    failures.append(f"{label}: {key} width {value['width']:.1f} != {target_width}")
                if not near(value["height"], target_height):
                    failures.append(f"{label}: {key} height {value['height']:.1f} != {target_height}")
                if target_font is not None and not near(value["fontSize"], target_font, 0.1):
                    failures.append(f"{label}: {key} font {value['fontSize']:.1f} != {target_font}")
                if value["zoom"] != "1" or value["transform"] != "none":
                    failures.append(f"{label}: {key} has scale/zoom")

            if values["desktop_nav"]["display"] == "none":
                failures.append(f"{label}: desktop navigation hidden")
            if values["mobile_nav"]["display"] != "none":
                failures.append(f"{label}: mobile navigation visible")
            if not near(values["stack"]["x"] + values["stack"]["width"] / 2, width / 2):
                failures.append(f"{label}: stack not centered")
            if values["stack"]["transform"] != "none" or values["stack"]["zoom"] != "1":
                failures.append(f"{label}: stack has scale/zoom")
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