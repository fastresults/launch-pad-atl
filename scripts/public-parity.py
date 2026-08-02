"""Compare public-site rendering fingerprints across origins.

Usage: python3 scripts/public-parity.py [preview URL] [published URL]
The gate rejects a release mismatch before evaluating layout.
"""

import asyncio
import json
from pathlib import Path
import sys
from urllib.parse import urljoin

from playwright.async_api import async_playwright


ORIGINS = tuple(sys.argv[1:]) or (
    "http://localhost:8080",
    "https://launch-pad-atl.lovable.app",
    "https://startuplabs.online",
    "https://www.startuplabs.online",
)
ROUTES = ("/", "/services", "/build")
VIEWPORTS = (
    (390, 844, 1.0),
    (1024, 900, 1.0),
    (1400, 900, 1.0),
    (1576, 1043, 1.8),
)
OUTPUT = Path("/tmp/public-parity")


async def measure(page, base, route):
    await page.goto(urljoin(base, route), wait_until="networkidle", timeout=60_000)
    await page.locator("h1").first.wait_for(state="visible", timeout=20_000)
    return await page.evaluate(
        """() => {
          const inspect = (element) => {
            if (!element) return null;
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              rect: {x: box.x, y: box.y, width: box.width, height: box.height},
              fontFamily: style.fontFamily, fontSize: style.fontSize,
              lineHeight: style.lineHeight, zoom: style.zoom, transform: style.transform,
            };
          };
          const root = getComputedStyle(document.documentElement);
          const body = getComputedStyle(document.body);
          const h1 = document.querySelector('h1');
          const header = document.querySelector('.sl-site-header') || document.querySelector('header');
          const main = document.querySelector('main');
          const prompt = document.querySelector('.sl-prompt__panel');
          const sectionHeading = document.querySelector('main section:not(.sl-hero) h2');
          const shell = document.querySelector('.public-surface');
          const shellZoom = shell ? parseFloat(getComputedStyle(shell).zoom || '1') : 1;
          const hero = document.querySelector('.sl-hero');
          const insetSections = [...document.querySelectorAll('.public-surface section:not(.sl-hero)')]
            .slice(0, 4)
            .map(node => {
              const box = node.getBoundingClientRect();
              const pad = parseFloat(getComputedStyle(node).paddingLeft) * shellZoom;
              return {left: box.left, width: box.width, padVisual: pad, padShare: pad / innerWidth};
            });
          return {
            url: location.href,
            release: document.documentElement.dataset.appRelease,
            cssBundle: document.documentElement.dataset.cssBundle,
            viewport: {width: innerWidth, height: innerHeight, clientWidth: document.documentElement.clientWidth, outerWidth, dpr: devicePixelRatio},
            screen: {width: screen.width, height: screen.height},
            visualScale: visualViewport?.scale ?? null,
            root: {fontSize: root.fontSize, zoom: root.zoom, transform: root.transform},
            body: {fontSize: body.fontSize, zoom: body.zoom, transform: body.transform},
            fonts: {status: document.fonts.status, body: body.fontFamily},
            shellZoom,
            heroBleed: hero ? {left: hero.getBoundingClientRect().left, width: hero.getBoundingClientRect().width} : null,
            insetSections,
            scrollWidth: document.documentElement.scrollWidth,
            assets: {
              css: [...document.querySelectorAll('link[rel="stylesheet"]')].map(node => node.href.split('/').pop()),
              js: [...document.querySelectorAll('script[src]')].map(node => node.src.split('/').pop()),
            },
            tiers: Object.fromEntries([640, 960, 1024, 1280, 1400, 1440].map(value => [value, matchMedia(`(min-width: ${value}px)`).matches])),
            header: inspect(header), h1: inspect(h1), main: inspect(main),
            prompt: inspect(prompt), sectionHeading: inspect(sectionHeading),
            h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
            h1EffectiveFontSize: h1 ? parseFloat(getComputedStyle(h1).fontSize) * shellZoom : null,
            h1LineHeight: h1 ? getComputedStyle(h1).lineHeight : null,
            h1ViewportShare: h1 ? h1.getBoundingClientRect().width / innerWidth : null,
            firstViewportDensity: main ? Math.min(main.getBoundingClientRect().height, innerHeight) / innerHeight : null,
          };
        }"""
    )


def close_enough(left, right, tolerance=1.0):
    if left is None or right is None:
        return left == right
    left_rect, right_rect = left["rect"], right["rect"]
    return all(abs(left_rect[key] - right_rect[key]) <= tolerance for key in ("x", "y", "width", "height"))


async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    failures = []
    report = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width, height, dpr in VIEWPORTS:
            for route in ROUTES:
                pair = {}
                for origin_index, base in enumerate(ORIGINS):
                    label = f"origin-{origin_index}"
                    context = await browser.new_context(
                        viewport={"width": width, "height": height}, device_scale_factor=dpr
                    )
                    page = await context.new_page()
                    pair[label] = await measure(page, base, route)
                    slug = route.strip("/").replace("/", "-") or "home"
                    await page.screenshot(path=str(OUTPUT / f"{label}-{slug}-{width}.png"))
                    await context.close()

                case = f"{route} at {width}x{height}@{dpr:g}x"
                baseline = pair["origin-0"]
                for label, values in list(pair.items())[1:]:
                    if baseline["release"] != values["release"]:
                        failures.append(f"{case}: {label} release mismatch")
                    for surface in ("header", "h1", "main", "prompt", "sectionHeading"):
                        if not close_enough(baseline[surface], values[surface]):
                            failures.append(f"{case}: {label} {surface} geometry differs")
                    if baseline["fonts"] != values["fonts"]:
                        failures.append(f"{case}: {label} font state differs")
                for label, values in pair.items():
                    if values["visualScale"] != 1:
                        failures.append(f"{case}: {label} visual viewport scale is not 1")
                    for surface in ("root", "body"):
                        if values[surface]["zoom"] != "1" or values[surface]["transform"] != "none":
                            failures.append(f"{case}: {label} {surface} is scaled")
                    if abs(values["shellZoom"] - 0.75) > 0.001:
                        failures.append(f"{case}: {label} public shell zoom is {values['shellZoom']} (expected 0.75)")
                    h1_size = values["h1EffectiveFontSize"] or 0
                    # Rendered (post-downscale) size caps.
                    cap = 26 if width < 1280 else 42
                    if h1_size > cap:
                        failures.append(f"{case}: {label} h1 renders at {h1_size:.1f}px (cap {cap}px)")
                    # Hero must be full bleed, edge to edge.
                    hero = values["heroBleed"]
                    if hero and (abs(hero["left"]) > 1 or abs(hero["width"] - width) > 2):
                        failures.append(f"{case}: {label} hero is not full bleed ({hero})")
                    # Every other section carries the required side margin.
                    expected = 0.20 if width >= 1024 else (0.12 if width >= 768 else 0.08)
                    for index, section in enumerate(values["insetSections"]):
                        if abs(section["padShare"] - expected) > 0.005:
                            failures.append(
                                f"{case}: {label} section {index} margin is {section['padShare']:.3f} (expected {expected})"
                            )
                    if values["scrollWidth"] > width + 1:
                        failures.append(f"{case}: {label} page overflows horizontally")
                    if values["main"] and width >= 1024 and values["main"]["rect"]["width"] > width:
                        failures.append(f"{case}: {label} main overflows the viewport")

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