#!/usr/bin/env python3
"""Public layout contract checks for local or deployed Startup Labs pages."""

import asyncio
import os
from playwright.async_api import async_playwright

WIDTHS = (390, 640, 767, 768, 900, 1023, 1024, 1280, 1400, 1920)
URLS = [os.environ.get("LOCAL_URL", "http://localhost:8080/")]
if os.environ.get("PUBLIC_URL"):
    URLS.append(os.environ["PUBLIC_URL"])


async def inspect(page, url: str, width: int) -> dict:
    await page.set_viewport_size({"width": width, "height": 900})
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_selector(".sl-site-header")
    return await page.evaluate("""
      () => {
        const nav = document.querySelector('.sl-site-header__nav');
        const mobile = document.querySelector('.sl-site-header__mobile');
        const hero = document.querySelector('.sl-hero');
        const container = document.querySelector('.public-container');
        const release = document.querySelector('meta[name="app-release"]')?.content ?? 'development';
        const css = [...document.styleSheets].map(s => s.href).find(h => h?.includes('/assets/') && h.endsWith('.css')) ?? 'development';
        return {
          innerWidth,
          nav: getComputedStyle(nav).display,
          mobile: getComputedStyle(mobile).display,
          heroWidth: hero?.getBoundingClientRect().width ?? null,
          containerWidth: container?.getBoundingClientRect().width ?? null,
          bodyWidth: document.body.getBoundingClientRect().width,
          release,
          css: css.split('/').pop(),
        };
      }
    """)


async def main() -> None:
    failures = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()
        results = {}
        for url in URLS:
            results[url] = {}
            for width in WIDTHS:
                metrics = await inspect(page, url, width)
                results[url][width] = metrics
                phone = width < 768
                if phone and not (metrics["nav"] == "none" and metrics["mobile"] != "none"):
                    failures.append(f"{url} @ {width}: phone navigation contract failed: {metrics}")
                if not phone and not (metrics["nav"] != "none" and metrics["mobile"] == "none"):
                    failures.append(f"{url} @ {width}: full navigation contract failed: {metrics}")
                if metrics["heroWidth"] is not None and abs(metrics["heroWidth"] - metrics["bodyWidth"]) > 1:
                    failures.append(f"{url} @ {width}: hero is not full bleed: {metrics}")
                if metrics["containerWidth"] is not None and metrics["containerWidth"] > 1201:
                    failures.append(f"{url} @ {width}: public container exceeds 1200px: {metrics}")
                print(f"PASS {url} {width}px nav={metrics['nav']} mobile={metrics['mobile']} release={metrics['release']}")
        await browser.close()

    if len(URLS) == 2:
        for width in WIDTHS:
            local, public = results[URLS[0]][width], results[URLS[1]][width]
            for key in ("nav", "mobile", "heroWidth", "containerWidth"):
                if local[key] != public[key]:
                    failures.append(f"parity @ {width}: {key} local={local[key]} public={public[key]}")

    if failures:
        raise SystemExit("\n".join(failures))


if __name__ == "__main__":
    asyncio.run(main())