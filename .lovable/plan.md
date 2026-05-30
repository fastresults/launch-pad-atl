## Goal

Rewrite the `/facilitator` page copy with the precision of a senior copywriter — integrating the verifiable specifics from Adam's resume (Citigroup, Mayo Clinic, 3M, Disney, CIS18→CIS26, St. Kitts & Nevis eGov portal, IRS portal, Expo 2020 Dubai, COVID-19 Ministry of Health work) and eliminating overlap between sections so each one earns its place.

## Redundancy to eliminate

Currently the page repeats the same beats 3–4 times:
- "40 years / four decades / 40+" appears in Hero, Story, Pillars, Stats
- "Fortune 500" appears in Hero, Story, Pillars, Stats, Timeline
- "Sovereign government / St. Kitts" appears in Story, Pillars, Timeline
- "Ships SaaS / builds with AI" appears in Story, Pillars, Stats, Timeline

Each fact should land **once**, in the section best suited to carry it.

## Section-by-section rewrite

### 1. `FacilitatorHero.tsx`
Tighten headline; replace the generic 40-years subhead with a sharper, more specific positioning line that hints at the rare three-way fluency (Fortune 500 + sovereign government + AI-native product).

### 2. `FacilitatorStats.tsx`
Replace soft numbers with resume-anchored ones:
- `18 yrs` — OPEN Interactive
- `4` — Fortune 500 clients named (Citigroup, Mayo Clinic, 3M, Disney)
- `5` — Caribbean Investment Summits produced (CIS18, 19, 24, 25, 26)
- `7 yrs` — embedded with the Government of St. Kitts & Nevis

### 3. `FacilitatorStory.tsx`
Restructure into three tight movements with no repetition of stats or pillar language:
- **Movement 1 — Boardrooms:** Orlando years. Experience centers for Mayo Clinic (Mall of America), 3M HIS Division, Amway Arena. Translating complex enterprise brands into immersive environments.
- **Movement 2 — Nations:** 2014 relocation to St. Kitts & Nevis. Co-founded the Caribbean entity. Engineered the Federation's central eGovernment Portal, Inland Revenue tax portal, and child protective services case management system. Branded the CBI program, advised the St. Kitts-Nevis pavilion at Expo 2020 Dubai, directed pro-bono COVID-19 crisis communications for the Ministry of Health.
- **Movement 3 — Frontier:** Founder & CEO of Ampfli ([askeve.io](https://askeve.io)); building the Institute of AI Professionals ([theiaip.com](https://theiaip.com)). Ships SaaS on the bleeding edge — frontier LLMs, agentic frameworks, AI-native code generation, vector databases, serverless edge infrastructure — and walks workshop audiences through the same live toolchain.
- Keep the pull-quote ("I didn't learn AI in a classroom…") — it's the soul of the page.

Note: Resume says **co-founded** OPEN Interactive Inc. (the Caribbean entity, 2014) but **founded** OPEN Interactive LLC in Orlando in 2009. Honor this distinction in the rewrite — Adam founded the original 2009 entity, co-founded the 2014 Caribbean entity. (Earlier turn asked us to say "founded" — that's accurate for 2009.)

### 4. `FacilitatorPillars.tsx`
Cut from 6 pillars to **6 sharper ones**, with new copy that doesn't echo the Story section:
- Practitioner-first AI fluency → keep frame, sharpen copy
- Startup velocity frameworks → reframe around "compressing time-to-launch"
- Personal brand authority → reframe around "narrative that compounds"
- Global business perspective → name-drop OECS, Fortune 500, Expo 2020 once
- Real-time transformation lens → keep
- Executive-caliber delivery → reframe around "rooms with heads of state and CMOs"

### 5. `FacilitatorTimeline.tsx`
Replace generic descriptions with resume-grade specifics:
- **1985–2008** — Fortune 500 brand & communications (Citigroup era foundation)
- **2009** — Founded OPEN Interactive LLC in Orlando. First Fortune 500 work: Mayo Clinic, 3M, Disney, Amway Arena
- **2014** — Relocated to St. Kitts & Nevis; co-founded OPEN Interactive Inc., the region's largest public-private technology partnership
- **2018** — Co-originated the Caribbean Investment Summit franchise; produced CIS18 through CIS26 across five OECS jurisdictions
- **2020** — Directed pro-bono COVID-19 crisis communications for the St. Kitts & Nevis Ministry of Health; advised the national pavilion at Expo 2020 Dubai
- **2022–present** — Ships AI-native SaaS (Ampfli, PivotHQ, AskEve, WorkshopAI)
- **2024–present** — Founder & CEO, Institute of AI Professionals (IAIP) — five founding chapters across five world regions

### 6. `FacilitatorAudience.tsx`
Keep four audience cards. Light copy polish only — this section is already doing its job and doesn't overlap with the rewrites above.

### 7. `FacilitatorCTA.tsx`
Light tightening; keep the email CTA.

## Out of scope
- No layout, color, or component-structure changes
- No new routes or assets
- No photo addition
- No DM Sans / Playfair font changes
