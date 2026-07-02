// Static content for the Georgia Legal Setup workflow.
// Everything the founder needs to legally form a business in Georgia and
// obtain a Federal EIN (FEIN), broken into 7 sequential steps.

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

export const GEORGIA_LEGAL_STEPS: LegalStep[] = [
  {
    key: "entity_choice",
    n: 1,
    label: "Choose your entity",
    short: "LLC, S-Corp, or Sole Proprietor — we recommend one and explain why.",
    detail:
      "For most solo and small founders in Georgia, a Limited Liability Company (LLC) is the right first move — it separates your personal assets from the startup, it's cheap to keep up ($50/year), and you can elect S-Corp tax treatment later once you're profitable. Choose Sole Proprietor only if you're testing an idea with no real revenue yet. Choose S-Corp from day one only if you already know you'll be taking a salary and profit distributions above ~$60K in year one.",
    estMinutes: 5,
    cost: "Free to decide",
    officialLinks: [
      { label: "IRS: Business structures overview", url: "https://www.irs.gov/businesses/small-businesses-self-employed/business-structures" },
    ],
  },
  {
    key: "name_check",
    n: 2,
    label: "Check + reserve your business name",
    short: "Make sure the name is available on the Georgia Corporations Division database.",
    detail:
      "Search the Georgia Secretary of State's business database to confirm your exact LLC name isn't already taken. Your name must include \"LLC\" or \"L.L.C.\" and can't be confusingly similar to an existing Georgia entity. If you're not ready to file today, you can reserve the name for 30 days for $25. If it's clear and you're filing this week, skip the reservation and go straight to Articles of Organization.",
    estMinutes: 10,
    cost: "Free to search · $25 to reserve (optional)",
    officialLinks: [
      { label: "GA Corporations business search", url: "https://ecorp.sos.ga.gov/BusinessSearch" },
      { label: "Reserve a business name (GA SOS)", url: "https://ecorp.sos.ga.gov/Account/Login?ReturnUrl=%2FNameReservation" },
    ],
    actionLabel: "Open GA business search",
  },
  {
    key: "registered_agent",
    n: 3,
    label: "Assign a Registered Agent",
    short: "Someone with a Georgia street address who accepts legal mail for the LLC.",
    detail:
      "Every Georgia LLC needs a Registered Agent with a physical Georgia street address (no PO boxes) available 9am–5pm business days. You have three options: (1) be your own agent using your home or office address — free, but it goes on the public record and you must be available; (2) use a cofounder or trusted contact; (3) hire a service like Northwest Registered Agent (~$125/year, includes mail scanning and privacy) or ZenBusiness (~$99/year). We recommend a service if you work from home and don't want your address public.",
    estMinutes: 10,
    cost: "$0 (self) · $99–$150/year (service)",
    officialLinks: [
      { label: "Northwest Registered Agent", url: "https://www.northwestregisteredagent.com/registered-agent/georgia" },
      { label: "ZenBusiness (GA)", url: "https://www.zenbusiness.com/georgia-registered-agent/" },
    ],
  },
  {
    key: "articles_filed",
    n: 4,
    label: "File Articles of Organization",
    short: "The official filing that creates your Georgia LLC.",
    detail:
      "File Articles of Organization (Form CD 030) online through eCorp. You'll need: your exact LLC name, the Registered Agent's name and Georgia address, the LLC's principal office address, and organizer info (usually you). $100 filing fee online, $110 by mail. Approval is usually 5–7 business days online, faster if you pay $100 expedited. Once approved, you get a Certificate of Organization and a Control Number — save both, you'll need them for your EIN and to open a bank account.",
    estMinutes: 20,
    cost: "$100 online · $110 mail · +$100 expedited",
    officialLinks: [
      { label: "File online (eCorp)", url: "https://ecorp.sos.ga.gov/Account/Login?ReturnUrl=%2FFilings%2FTypeSelection" },
      { label: "Form CD 030 (PDF)", url: "https://sos.ga.gov/sites/default/files/forms/031_Articles%20of%20Organization%20for%20LLC.pdf" },
    ],
    actionLabel: "File on eCorp",
  },
  {
    key: "ein",
    n: 5,
    label: "Get your Federal EIN (FEIN)",
    short: "Free 10-minute IRS application. You need it for banking, taxes, and hiring.",
    detail:
      "Apply for your Employer Identification Number directly on the IRS site — it's free and takes about 10 minutes. Use the online application (available Mon–Fri, 7am–10pm ET). Key answers: legal structure is \"Limited Liability Company\"; number of members = you (and cofounders); state = Georgia; reason = \"Started a new business\"; responsible party = you (SSN or ITIN required). At the end, download and save the CP 575 confirmation PDF immediately — the IRS will not email it to you and you cannot get it re-issued.",
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
      "Georgia doesn't legally require an Operating Agreement, but banks, investors, and courts do. It defines ownership percentages, how profits are split, who can sign for the company, what happens if a member leaves, and how disputes are settled. Generate a Georgia-specific draft below from your filing info, review it with a lawyer if you have cofounders or outside money, and sign copies for every member. Store the signed original with your Articles.",
    estMinutes: 30,
    cost: "Free (generated) · $300–$600 with lawyer review",
    officialLinks: [
      { label: "Georgia LLC Act (O.C.G.A. Title 14, Ch. 11)", url: "https://law.justia.com/codes/georgia/2022/title-14/chapter-11/" },
    ],
    actionLabel: "Generate my Operating Agreement",
  },
  {
    key: "post_formation",
    n: 7,
    label: "Post-formation checklist",
    short: "Bank account, annual registration, licenses, and taxes.",
    detail:
      "You're officially formed — now keep the LLC in good standing:\n\n• Open a business bank account (bring your Articles, EIN letter, and Operating Agreement). Chase, Bluevine, Mercury, and Relay all work well for early startups.\n• Register for Georgia sales/use tax at Georgia Tax Center if you sell taxable goods or services.\n• Get your local business license — Atlanta founders apply through the ATLCore portal; other cities/counties have their own occupation-tax certificates.\n• Calendar your GA Annual Registration — $50, due every year by April 1, filed on eCorp.\n• Beneficial Ownership Information (BOI) report to FinCEN is currently paused by federal court order for most domestic LLCs. Check the FinCEN link before assuming you owe it.\n• Set up simple bookkeeping (Wave, QuickBooks, or a spreadsheet) starting day one.",
    estMinutes: 60,
    cost: "$50/year GA registration · varies by city",
    officialLinks: [
      { label: "GA Annual Registration (eCorp)", url: "https://ecorp.sos.ga.gov/Account/Login?ReturnUrl=%2FAnnualRegistration" },
      { label: "Georgia Tax Center (sales tax)", url: "https://gtc.dor.ga.gov/" },
      { label: "Atlanta business license (ATLCore)", url: "https://www.atlantaga.gov/government/departments/finance/office-of-revenue/business-tax" },
      { label: "FinCEN BOI reporting status", url: "https://www.fincen.gov/boi" },
    ],
  },
];

export function recommendEntity(input: {
  hasCofounders?: boolean;
  expectedRevenueUsd?: number;
  isTestingIdea?: boolean;
}): { choice: "llc" | "s_corp" | "sole_prop"; reason: string } {
  if (input.isTestingIdea && !input.hasCofounders) {
    return {
      choice: "sole_prop",
      reason:
        "You're still testing the idea with no revenue yet. Stay a sole proprietor for now — you can form an LLC in a week whenever you're ready to take real money.",
    };
  }
  if ((input.expectedRevenueUsd ?? 0) >= 80_000 && !input.hasCofounders) {
    return {
      choice: "s_corp",
      reason:
        "You're forecasting real profit in year one as a solo founder. An S-Corp election can save you self-employment tax once your net is above ~$60K — talk to a CPA about the payroll requirements before electing.",
    };
  }
  return {
    choice: "llc",
    reason:
      "An LLC is the right first move for you: personal-asset protection, low upkeep ($50/year in GA), and you can elect S-Corp tax treatment later without re-forming.",
  };
}
