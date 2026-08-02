"""Compare the Lovable preview and published public-site geometry.

Usage: python3 scripts/public-parity.py [preview URL] [published URL]
The gate rejects a release mismatch before evaluating layout.
"""

import asyncio
import json
from pathlib import Path
import sys
from urllib.parse import urljoin

from playwright.async_api import async_playwright


PREVIEW = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
PUBLISHED = sys.argv[2] if len(sys.argv) > 2 else "https://startuplabs.online"
ROUTES = ("/", "/services", "/build", "/build/brand", "/one-on-one")
VIEWPORTS = (
    (1024, 900, 1.0),
    (1027, 900, 1.0),
    (1100, 900, 1.0),
    (1152, 900, 1.0),
    (1190, 900, 1.0),
    (1200, 900, 1.0),
    (1280, 900, 1.0),
    (1400, 900, 1.0),
    (1576, 1043, 1.8),
    (1920, 1080, 1.0),
)
OUTPUT = Path("/tmp/public-parity")


async def measure(page, base, route):
    await page.goto(urljoin(base, route), wait_until="networkidle", timeout=60_000)
    await page.locator("h1").first.wait_for(state="visible", timeout=20_000)
    return await page.evaluate(
        """() => {
          const rect = (element) => {
            if (!element) return null;
            const box = element.getBoundingClientRect();
            return {x: box.x, y: box.y, width: box.width, height: box.height};
          };
          const root = getComputedStyle(document.documentElement);
          const body = getComputedStyle(document.body);
          const h1 = document.querySelector('h1');
          const header = document.querySelector('.sl-site-header') || document.querySelector('header');
          const main = document.querySelector('main');
          return {
            url: location.href,
            release: document.documentElement.dataset.appRelease,
            version: document.documentElement.dataset.appVersion,
            cssBundle: document.documentElement.dataset.cssBundle,
            viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
            screen: {width: screen.width, height: screen.height},
            visualScale: visualViewport?.scale ?? null,
            root: {fontSize: root.fontSize, zoom: root.zoom, transform: root.transform},
            body: {fontSize: body.fontSize, zoom: body.zoom, transform: body.transform},
            header: rect(header), h1: rect(h1), main: rect(main),
            h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
            h1LineHeight: h1 ? getComputedStyle(h1).lineHeight : null,
            h1ViewportShare: h1 ? rect(h1).width / innerWidth : null,
            firstViewportDensity: main ? Math.min(rect(main).height, innerHeight) / innerHeight : null,
          };
        }"""
    )


def close_enough(left, right, tolerance=2.0):
    if left is None or right is None:
        return left == right
    return all(abs(left[key] - right[key]) <= tolerance for key in ("x", "y", "width", "height"))


async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    failures = []
    report = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width, height, dpr in VIEWPORTS:
            for route in ROUTES:
                pair = {}
                for label, base in (("preview", PREVIEW), ("published", PUBLISHED)):
                    context = await browser.new_context(
                        viewport={"width": width, "height": height}, device_scale_factor=dpr
                    )
                    page = await context.new_page()
                    pair[label] = await measure(page, base, route)
                    slug = route.strip("/").replace("/", "-") or "home"
                    await page.screenshot(path=str(OUTPUT / f"{label}-{slug}-{width}.png"))
                    await context.close()

                case = f"{route} at {width}x{height}@{dpr:g}x"
                if pair["preview"]["release"] != pair["published"]["release"]:
                    failures.append(
                        f"{case}: release mismatch "
                        f"{pair['preview']['release']} != {pair['published']['release']}"
                    )
                for surface in ("header", "h1", "main"):
                    if not close_enough(pair["preview"][surface], pair["published"][surface]):
                        failures.append(f"{case}: {surface} geometry differs")
                for label, values in pair.items():
                    if values["visualScale"] != 1:
                        failures.append(f"{case}: {label} visual viewport scale is not 1")
                    for surface in ("root", "body"):
                        if values[surface]["zoom"] != "1" or values[surface]["transform"] != "none":
                            failures.append(f"{case}: {label} {surface} is scaled")
                    h1_size = float(values["h1FontSize"].replace("px", "")) if values["h1FontSize"] else 0
                    if width <= 1920 and h1_size > 56:
                        failures.append(f"{case}: {label} h1 is {h1_size:g}px on desktop")
                    if values["h1"] and values["h1"]["width"] > width * 0.82:
                        failures.append(f"{case}: {label} h1 occupies too much viewport width")
                report.append({"case": case, **pair})
        await browser.close()

    (OUTPUT / "report.json").write_text(json.dumps(report, indent=2))
    if failures:
        print("PUBLIC PARITY GATE FAILED", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        raise SystemExit(1)
    print("PUBLIC PARITY GATE PASSED")


asyncio.run(main())