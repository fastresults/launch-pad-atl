## Goal
Produce a single 1:1 promotional image for the next Foundation Workshop (Thursday, Aug 20, 2026 · IGNITE Center at Greater Atlanta Christian School) patterned after the attached HDSI "Chief AI Officer" ad — same layout DNA (left-aligned serif headline, portrait bleeding off the right, diagonal brand accent, small credibility line at the bottom), but featuring a **middle-aged woman** as the subject and StartupLabs branding/voice.

## Deliverables
1. `public/social-ad-startup-labs-aug20.jpg` — 1080×1080 promotional image
2. `public/social-ad-startup-labs-aug20-copy.md` — matching LinkedIn + Facebook captions

## Image concept (patterned after reference)
- **Layout:** Left 55% = typography on soft cream/espresso background. Right 45% = confident middle-aged woman (mid-40s to early-50s), warm smile, in a bright, out-of-focus workspace. Two diagonal brand-blue accent bars sweep from the top-right corner (mirrors the HDSI red slashes but in StartupLabs blue `#628acf`).
- **Top-left lockup:** StartupLabs logo mark + wordmark, small.
- **Headline (large serif, italic emphasis on the middle line):**
  > Start the business
  > *you've been waiting on.*
- **Sub-lockup (underlined label + small caps qualifier):**
  > The Foundation Workshop
  > ONE-MORNING BUILD
- **Bottom credibility line (small):**
  > Thursday, August 20, 2026 · 8:45–11:30 AM · IGNITE Center at Greater Atlanta Christian School, Norcross GA. Leave with a live page at your domain, a priced offer, and your first outreach sent — built with you, not handed to you. startuplabs.online
- **Palette:** Cream `#FAF8F5` bg, espresso `#3D2E1F` type, brand blue `#628acf` diagonals — matches the site's Warm Sand system.
- **Style rules:** No stock-looking gloss; editorial "Sunday paper" feel; woman photographed naturally (no AI-typical over-smoothed skin, no logos on her clothing, no visible text artifacts in the photo area).

## Generation approach
Use `imagegen--generate_image` at **premium** quality (typography must render cleanly). Single 1024×1024 render, then save to `public/`. If any text renders garbled on the first pass, re-run with a tightened prompt rather than post-editing.

## Copy file contents
Three short captions in `public/social-ad-startup-labs-aug20-copy.md`:
- **LinkedIn (primary)** — Plan-B founder angle, one focused morning, artifact list, IGNITE Center credibility, CTA to `startuplabs.online`.
- **LinkedIn (short reshare)** — one-liner + CTA.
- **Facebook (local/community)** — neighborly Norcross tone, same CTA.

All captions end with: `startuplabs.online · Thursday, Aug 20 · reserve your seat`.

## Out of scope
No site code changes, no route or component edits — image + markdown file only.
