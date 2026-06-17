
# Guided Social Account Setup Wizard

A novice-friendly, completely hand-held flow that walks an admin through creating each social media account **before** they connect it to Zernio. Covers all 14 Zernio platforms, with progress saved per user in the database so they can stop and resume.

## User flow

```text
Admin → Social → Setup wizard
  │
  ├─ Step 0: Brand asset prep (one time)
  │     • Display name + handle ideas (with availability tips)
  │     • Short bio (160 chars) + long bio
  │     • Profile image / logo upload (square, 400x400+)
  │     • Banner image upload (1500x500)
  │     • Brand link (website URL)
  │     • Saved once, reused on every platform
  │
  ├─ Step 1..N: One card per platform (X, Instagram, Facebook,
  │             LinkedIn, TikTok, YouTube, Pinterest, Reddit,
  │             Bluesky, Threads, Google Business, Telegram,
  │             Snapchat, Discord)
  │     Each card has a 4-stage checklist:
  │       a. Create the account  → "Open <platform> signup" deep link
  │       b. Verify email / phone → tips + troubleshooting
  │       c. Complete the profile → pre-filled copy/paste from Step 0
  │                                 (name, bio, link, image, banner)
  │       d. Connect to Zernio    → launches existing Zernio OAuth flow
  │     Each stage has its own checkbox; progress persists.
  │
  └─ Done view: summary of completed/connected platforms + next steps
                (Create your first post →)
```

## Per-platform content (the "hand-held" part)

For every platform we ship a small content pack rendered in the wizard card:

- **What it is** — one sentence, why a startup should be on it.
- **Before you start** — what you need (email, phone, ID, business doc, etc.).
- **Step-by-step** — numbered list, 4–8 steps, written for someone who has never used the platform.
- **Common gotchas** — e.g. "X requires a phone number", "Facebook Page must be created from a personal account", "LinkedIn Company Page needs 1 personal connection", "TikTok business accounts can't use copyrighted music in ads", "Google Business needs a verifiable address/postcard".
- **Open signup** button — deep link to the platform's signup URL in a new tab.
- **Copy-to-clipboard** chips for the brand assets from Step 0 (handle, bio, link).
- **"Mark this step done"** checkbox per stage (4 per platform).
- **"Connect to Zernio"** button — only enabled after stages a/b/c are checked. Reuses the existing `getConnectUrl` flow from `src/lib/zernio.functions.ts`.

Content lives in a typed registry `src/lib/zernio-setup-guides.ts` so it's easy to edit copy without touching components.

## Where it lives in the admin

- New route: `src/routes/_authenticated/_admin/admin.social.setup.tsx` — wizard overview + platform progress grid.
- New route: `src/routes/_authenticated/_admin/admin.social.setup.$platform.tsx` — detail view for a single platform.
- `admin-nav.ts` gets a new entry under the existing **Social** group: **"Setup wizard"** (listed first, above Profiles, Accounts, Compose, Posts, Analytics).
- `admin.social.tsx` (overview) gets a banner: *"New here? Start with the setup wizard →"* shown until all 14 platforms are marked connected.

## Data model

Two small tables, persisted per admin user, scoped by RLS to that user (admins shouldn't see each other's brand draft).

```text
social_setup_brand
  user_id (PK, fk → auth.users)
  display_name, handle, short_bio, long_bio, website_url
  logo_url, banner_url   (Supabase Storage in existing user-media bucket)
  created_at, updated_at

social_setup_progress
  id (uuid pk)
  user_id (fk → auth.users)
  platform (text)         -- one of the 14 Zernio platforms
  account_created   bool default false
  email_verified    bool default false
  profile_completed bool default false
  zernio_connected  bool default false
  notes text
  created_at, updated_at
  unique (user_id, platform)
```

RLS: each row is readable/writable only by `auth.uid() = user_id`, plus `public.has_role(auth.uid(), 'admin')` for admins to manage their own rows. Full GRANTs for `authenticated` + `service_role`.

## Technical details

- New file `src/lib/zernio-setup-guides.ts` — typed array of platform guides (id, label, signup URL, steps, gotchas, required-assets list, deep links to platform branding spec pages).
- New file `src/lib/social-setup.functions.ts` — TanStack Query wrappers:
  - `getBrand()`, `upsertBrand(input)`
  - `listProgress()`, `upsertProgressStage(platform, stage, value)`
  - All hit Supabase directly (no edge function needed — it's user-owned data).
- Wizard UI uses existing shadcn primitives: `Card`, `Progress`, `Checkbox`, `Tabs`, `Accordion`, `Button`, `Input`, `Textarea`, plus `sonner` toasts. No new deps.
- Image uploads go to existing `user-media` storage bucket under `social-brand/{userId}/{logo|banner}.{ext}`.
- "Connect to Zernio" reuses `getConnectUrl(platform, profileId)`. If no Zernio profile exists yet, the wizard prompts to create one inline via the existing `createProfile` function before opening OAuth.
- Auto-detection: when `accounts.list` from Zernio returns an account for a platform, mark `zernio_connected = true` and surface a green check in the wizard grid — so progress stays accurate even if the user connects outside the wizard.
- Progress bar at the top of `admin.social.setup.tsx` shows `X / 14 platforms ready`.

## Out of scope (v1)

- Automated handle availability checks across platforms (each platform's API is gated; we just link out to their availability checkers).
- Automatically pushing the saved logo/bio into each platform via API (most don't allow it during signup).
- Multi-admin shared brand kit — each admin has their own draft for now.

## Open questions

1. Should the brand asset prep (Step 0) be **per-admin** (private draft) or **shared across all admins** for this workspace? Plan currently assumes per-admin; flipping to shared is a one-line RLS change.
2. For platforms the user isn't interested in (e.g. Snapchat for a B2B startup), should we add a "Skip / not relevant" state so the grid can show 100% without forcing all 14?
