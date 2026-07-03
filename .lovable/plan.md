
# Multi-State Legal Setup (All 50 States + DC)

Today `src/lib/legal-setup.ts` hardcodes Georgia into every step (name search URL, Registered Agent rules, Articles filing fee/form, annual report cost, Atlanta business license, GA Tax Center, GA LLC Act citation). The Operating Agreement edge function also hardcodes "Georgia" and O.C.G.A. § 14-11. We'll expand to every US jurisdiction.

## Scope of state coverage

**All 50 states + DC = 51 jurisdictions**, every one selectable from day one:

AL, AK, AZ, AR, CA, CO, CT, DE, DC, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY.

Every jurisdiction ships with the full field set below — no "basic tier". A "Popular for holding companies" group (DE, WY, NV, TX, FL) surfaces at the top of the picker, then the full A→Z list.

## Architecture

### 1. New data module: `src/lib/legal-setup-states.ts`

Single source of truth. One record per jurisdiction:

```ts
export type StateJurisdiction = {
  code: string;                          // USPS ("GA","DE","DC"…)
  name: string;                          // "Georgia"
  filingAgency: string;                  // "Georgia Secretary of State, Corporations Division"
  filingAgencyAddress: string;           // mailing address for paper filings
  filingAgencyPhone?: string;
  llcSuffixRequired: string[];           // ["LLC","L.L.C.","Limited Liability Company"]
  nameSearchUrl: string;
  nameReservationUrl?: string;
  nameReservationFeeUsd?: number;
  nameReservationDays?: number;
  articlesFormName: string;              // "Articles of Organization" / "Certificate of Formation"
  articlesOnlineUrl: string;
  articlesPdfUrl?: string;
  articlesFeeOnlineUsd: number;
  articlesFeeMailUsd?: number;
  articlesExpediteFeeUsd?: number;
  articlesTypicalDays: string;
  registeredAgentRules: string;
  annualReport: {
    required: boolean;
    label: string;                       // "Annual Report" / "Franchise Tax" / "Biennial Statement"
    feeUsd: number;
    dueRule: string;
    filingUrl: string;
  };
  salesTaxAgency?: { name: string; url: string };
  llcActCitation: string;                // "O.C.G.A. § 14-11" / "6 Del. C. § 18" / "Cal. Corp. Code § 17701"
  llcActUrl: string;
  notes?: string;                        // e.g. NY publication req, CA $800 min, NV Initial List
};

export const STATE_JURISDICTIONS: StateJurisdiction[] = [ /* 51 entries */ ];
export const POPULAR_STATES = ["DE","WY","NV","TX","FL"];
```

Data is researched from each state's Secretary of State (or equivalent) and statute code, with source URLs cited inline in the data file for auditability. Known gotchas baked in:

- **DE** — Certificate of Formation $110; no annual report but $300 franchise tax due June 1.
- **CA** — Articles $70; $800 minimum franchise tax (FTB); biennial Statement of Info $20; LLC publication not required.
- **NY** — Articles $200 + newspaper publication requirement (~$400–$2,000 in NYC counties); biennial statement $9.
- **TX** — Certificate of Formation $300; annual Public Information Report + franchise tax (no-tax-due below threshold).
- **MA** — $500 filing; $500 annual report.
- **FL** — $125; annual report $138.75 due May 1.
- **WY** — $100; annual report license tax $60 minimum.
- **NV** — $75 Articles + $150 Initial List + $200 State Business License annually.
- **AZ, NE, NY** — LLC publication requirements handled in `notes`.
- **LA** — parish-level notarization noted.
- **DC** — biennial report $300 (unusual cadence flagged).

### 2. Refactor `src/lib/legal-setup.ts`

Replace `GEORGIA_LEGAL_STEPS` with `buildLegalSteps(state: StateJurisdiction): LegalStep[]` that interpolates state-specific fees, URLs, addresses, and copy into the existing 7 steps. Keep step `key`s stable so `steps_completed` records still match. `recommendEntity` gains a sentence appended for high-cost states (CA $800 minimum tax, NY publication).

### 3. Persist selection

`legal_setup_progress` already has an `entity_state` column — we'll reuse it as the state code (backfill any existing rows to `'GA'`). No schema change unless a read shows the column is missing; if so, migration adds `state_code text default 'GA'`.

Helper `setMyLegalSetupState(code)` calls `upsertMyLegalSetup({ entity_state: code })`.

### 4. UI

- **State picker** at the top of `src/routes/_authenticated/dashboard/legal-setup.tsx`: Combobox with search over all 51, "Popular" group first (DE/WY/NV/TX/FL), then A→Z. Full state name + code shown.
- **LegalSetupCard** (`src/components/foundation/LegalSetupCard.tsx`) shows selected state ("Form your Delaware startup") with a "Change state" link. Copy uses "startup" per project rule.
- Step detail panels render fees/URLs/addresses from the state record instead of hardcoded strings.
- Non-Georgia states hide the Atlanta ATLCore link; replace with a generic "check your city/county business license" note linking to the state's business portal.
- Show state-specific `notes` (e.g. NY publication warning) as a callout inside the relevant step.

### 5. Operating Agreement generator

Update `supabase/functions/venture-generate-operating-agreement/index.ts`:
- Read `entity_state` from `legal_setup_progress`.
- Ship a tiny 51-entry map inside the function (name + LLC-act citation) — no cross-import from `src/`.
- Replace hardcoded "Georgia" / "O.C.G.A. § 14-11" in the system prompt and Governing Law article with the selected state.

### 6. Copy-rule compliance

Per project memory ("startup", never "business" in UI copy): audit the strings touched. `LegalSetupCard` headline becomes "Form your {State} startup".

## Files touched

- `src/lib/legal-setup-states.ts` (new — 51 fully researched entries with citations)
- `src/lib/legal-setup.ts` (convert to factory)
- `src/lib/legal-setup.functions.ts` (state setter)
- `src/routes/_authenticated/dashboard/legal-setup.tsx` (state picker + wire factory)
- `src/components/foundation/LegalSetupCard.tsx` (dynamic state name)
- `supabase/functions/venture-generate-operating-agreement/index.ts` (state-aware prompt)
- Migration only if `entity_state` doesn't exist or needs a default.

## Out of scope

- Auto-filing via any state API (all states still route to official portals).
- Foreign qualification (e.g. DE LLC operating in GA) — surfaced as a warning callout only, not a wizard.
- Tax registration wizards beyond linking to the correct agency.

## Open questions

1. **Default state** for new users: keep GA, or auto-detect from the founder's `member_filings.state` if present?
2. **Foreign-qualification warning**: show now ("You picked Delaware but live in Georgia — you'll also need to register as a foreign LLC where you operate"), or defer?
