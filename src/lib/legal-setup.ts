// Content for the multi-state Legal Setup workflow.
// Every step is generated from a `StateJurisdiction` record so the founder
// can pick any US state (all 50 + DC) and get accurate offices, fees,
// and links.

import { getStateByCode, type StateJurisdiction } from "./legal-setup-states";

export type LegalStep = {
  key: string;
  n: number;
  label: string;
  short: string;
  detail: string;
  estMinutes: number;
  cost: string;
  officialLinks: { label: string; url: string }[];
  actionLabel?: string;
};

function fmtUsd(n: number | undefined): string {
  if (n === undefined || n === null) return "$0";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function buildLegalSteps(state: StateJurisdiction): LegalStep[] {
  const S = state;
  const suffixList = S.llcSuffixRequired.slice(0, 3).join(", ");
  const nameReserveCost = S.nameReservationFeeUsd
    ? `${fmtUsd(S.nameReservationFeeUsd)} to reserve (${S.nameReservationDays ?? 30} days)`
    : "no name reservation offered";

  const articlesCost = [
    `${fmtUsd(S.articlesFeeOnlineUsd)} online`,
    S.articlesFeeMailUsd ? `${fmtUsd(S.articlesFeeMailUsd)} mail` : null,
    S.articlesExpediteFeeUsd ? `+${fmtUsd(S.articlesExpediteFeeUsd)} expedite` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    {
      key: "entity_choice",
      n: 1,
      label: "Choose your entity",
      short: `LLC, S-Corp, or Sole Proprietor — recommendation for ${S.name}.`,
      detail:
        `For most solo and small founders in ${S.name}, a Limited Liability Company (LLC) is the right first move — it separates your personal assets from the startup, and you can elect S-Corp tax treatment later once you're profitable. Choose Sole Proprietor only if you're testing an idea with no real revenue yet. Choose S-Corp from day one only if you already know you'll be taking a salary and profit distributions above ~$60K in year one.` +
        (S.notes ? `\n\n${S.name} note: ${S.notes}` : ""),
      estMinutes: 5,
      cost: "Free to decide",
      officialLinks: [
        { label: "IRS: Business structures overview", url: "https://www.irs.gov/businesses/small-businesses-self-employed/business-structures" },
        { label: `${S.name} LLC Act (${S.llcActCitation})`, url: S.llcActUrl },
      ],
    },
    {
      key: "name_check",
      n: 2,
      label: "Check + reserve your business name",
      short: `Search the ${S.filingAgency} database and (optionally) reserve the name.`,
      detail:
        `Search ${S.filingAgency}'s business database to confirm your exact LLC name isn't already taken. Your name must include one of: ${suffixList}. It can't be confusingly similar to an existing ${S.name} entity.` +
        (S.nameReservationFeeUsd
          ? ` If you're not ready to file today, you can reserve the name for ${S.nameReservationDays ?? 30} days for ${fmtUsd(S.nameReservationFeeUsd)}.`
          : ` ${S.name} doesn't offer a formal name reservation — file your Articles when the name clears the search.`),
      estMinutes: 10,
      cost: `Free to search · ${nameReserveCost}`,
      officialLinks: [
        { label: `${S.name} business name search`, url: S.nameSearchUrl },
        ...(S.nameReservationUrl ? [{ label: "Reserve a name", url: S.nameReservationUrl }] : []),
      ],
      actionLabel: `Open ${S.name} business search`,
    },
    {
      key: "registered_agent",
      n: 3,
      label: "Assign a Registered Agent",
      short: `Someone with a ${S.name} street address who accepts legal mail.`,
      detail:
        S.registeredAgentRules +
        `\n\nYour three options: (1) be your own agent — free, but your address goes on the public record and you must be available business hours; (2) use a cofounder or trusted contact who lives in ${S.name}; (3) hire a commercial service like Northwest Registered Agent (~$125/yr, includes mail scanning and privacy) or ZenBusiness (~$99/yr). Use a service if you work from home and don't want your address public — or if you don't live in ${S.name}.`,
      estMinutes: 10,
      cost: "$0 (self) · $99–$150/year (service)",
      officialLinks: [
        { label: `Northwest Registered Agent — ${S.name}`, url: "https://www.northwestregisteredagent.com/registered-agent" },
        { label: "ZenBusiness", url: "https://www.zenbusiness.com/registered-agent-service/" },
      ],
    },
    {
      key: "articles_filed",
      n: 4,
      label: `File ${S.articlesFormName}`,
      short: `The official filing that creates your ${S.name} LLC.`,
      detail:
        `File the ${S.articlesFormName} with the ${S.filingAgency} (${S.filingAgencyAddress}${S.filingAgencyPhone ? ` · ${S.filingAgencyPhone}` : ""}). You'll need your exact LLC name, the Registered Agent's name and ${S.name} address, the LLC's principal office address, and organizer info (usually you). ${articlesCost}. Approval typically takes ${S.articlesTypicalDays}. Once approved, save your filed certificate and any control/entity number — you'll need it for your EIN and to open a bank account.`,
      estMinutes: 20,
      cost: articlesCost,
      officialLinks: [
        { label: `File online (${S.name})`, url: S.articlesOnlineUrl },
        ...(S.articlesPdfUrl ? [{ label: "PDF form", url: S.articlesPdfUrl }] : []),
      ],
      actionLabel: `File in ${S.name}`,
    },
    {
      key: "ein",
      n: 5,
      label: "Get your Federal EIN (FEIN)",
      short: "Free 10-minute IRS application. Needed for banking, taxes, and hiring.",
      detail:
        `Apply for your Employer Identification Number directly on the IRS site — it's free and takes about 10 minutes. Use the online application (Mon–Fri, 7am–10pm ET). Key answers: legal structure is "Limited Liability Company"; number of members = you (and cofounders); state = ${S.name}; reason = "Started a new business"; responsible party = you (SSN or ITIN required). At the end, download and save the CP 575 confirmation PDF immediately — the IRS will not email it and it cannot be re-issued.`,
      estMinutes: 15,
      cost: "Free (IRS charges nothing)",
      officialLinks: [
        { label: "IRS EIN online application", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" },
        { label: "Form SS-4 (reference)", url: "https://www.irs.gov/forms-pubs/about-form-ss-4" },
      ],
      actionLabel: "Apply on IRS.gov",
    },
    {
      key: "operating_agreement",
      n: 6,
      label: "Sign an Operating Agreement",
      short: "The internal contract that governs how your LLC actually runs.",
      detail:
        `${S.name} doesn't always legally require an Operating Agreement, but banks, investors, and courts do. It defines ownership percentages, profit splits, signing authority, what happens if a member leaves, and dispute resolution. Generate a ${S.name}-specific draft below from your filing info (cites ${S.llcActCitation}), review with a lawyer if you have cofounders or outside money, and sign copies for every member. Store the signed original with your Articles.`,
      estMinutes: 30,
      cost: "Free (generated) · $300–$600 with lawyer review",
      officialLinks: [
        { label: `${S.name} LLC Act (${S.llcActCitation})`, url: S.llcActUrl },
      ],
      actionLabel: "Generate my Operating Agreement",
    },
    {
      key: "post_formation",
      n: 7,
      label: "Post-formation checklist",
      short: `Bank account, ${S.annualReport.label.toLowerCase()}, licenses, and taxes.`,
      detail:
        `You're officially formed — now keep the LLC in good standing:\n\n` +
        `• Open a business bank account (bring your filed Articles, EIN letter, and Operating Agreement). Chase, Bluevine, Mercury, and Relay all work well for early startups.\n` +
        (S.salesTaxAgency
          ? `• Register with the ${S.salesTaxAgency.name} if you sell taxable goods or services (${S.salesTaxAgency.url}).\n`
          : "") +
        `• Get your local business license from your city or county — every jurisdiction has its own occupation-tax certificate.\n` +
        (S.annualReport.required
          ? `• Calendar your ${S.name} ${S.annualReport.label} — ${fmtUsd(S.annualReport.feeUsd)}, ${S.annualReport.dueRule}. File at ${S.annualReport.filingUrl}.\n`
          : `• ${S.name} does not require an annual report for LLCs — but confirm on the ${S.filingAgency} site before assuming.\n`) +
        `• Beneficial Ownership Information (BOI) report to FinCEN is currently paused by federal court order for most domestic LLCs. Check FinCEN before assuming you owe it.\n` +
        `• Set up simple bookkeeping (Wave, QuickBooks, or a spreadsheet) starting day one.` +
        (S.notes ? `\n\n⚠️ ${S.name} note: ${S.notes}` : ""),
      estMinutes: 60,
      cost: S.annualReport.required
        ? `${fmtUsd(S.annualReport.feeUsd)} ${S.annualReport.label.toLowerCase()} · varies by city`
        : "varies by city",
      officialLinks: [
        ...(S.annualReport.required
          ? [{ label: `${S.name} ${S.annualReport.label}`, url: S.annualReport.filingUrl }]
          : []),
        ...(S.salesTaxAgency ? [{ label: S.salesTaxAgency.name, url: S.salesTaxAgency.url }] : []),
        { label: "FinCEN BOI reporting status", url: "https://www.fincen.gov/boi" },
      ],
    },
  ];
}

// Legacy alias for anything still importing the original constant.
export const GEORGIA_LEGAL_STEPS: LegalStep[] = buildLegalSteps(getStateByCode("GA"));

export function recommendEntity(input: {
  hasCofounders?: boolean;
  expectedRevenueUsd?: number;
  isTestingIdea?: boolean;
  stateCode?: string;
}): { choice: "llc" | "s_corp" | "sole_prop"; reason: string } {
  const state = input.stateCode ? getStateByCode(input.stateCode) : null;
  const stateNote =
    state?.code === "CA"
      ? " Heads up: California charges every LLC an $800 minimum franchise tax every year — factor that into your decision."
      : state?.code === "NY"
      ? " Heads up: New York has a mandatory newspaper publication requirement after formation — budget an extra ~$400 (upstate) to $2,000+ (NYC)."
      : "";

  if (input.isTestingIdea && !input.hasCofounders) {
    return {
      choice: "sole_prop",
      reason:
        "You're still testing the idea with no revenue yet. Stay a sole proprietor for now — you can form an LLC in a week whenever you're ready to take real money." +
        stateNote,
    };
  }
  if ((input.expectedRevenueUsd ?? 0) >= 80_000 && !input.hasCofounders) {
    return {
      choice: "s_corp",
      reason:
        "You're forecasting real profit in year one as a solo founder. An S-Corp election can save you self-employment tax once your net is above ~$60K — talk to a CPA about the payroll requirements before electing." +
        stateNote,
    };
  }
  return {
    choice: "llc",
    reason:
      `An LLC is the right first move for you: personal-asset protection, and you can elect S-Corp tax treatment later without re-forming.` +
      stateNote,
  };
}
