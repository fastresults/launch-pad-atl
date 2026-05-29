export type ValueRow = {
  stageN: number;
  stageLabel: string;
  deliverable: string;
  marketCostMin: number;
  marketCostMax: number;
  diyHoursMin: number;
  diyHoursMax: number;
  postWorkshop?: string;
};

export const VALUE_ROWS: ValueRow[] = [
  { stageN: 1, stageLabel: "Form", deliverable: "GA LLC filing packet — Articles pre-filled, registered agent set", marketCostMin: 126, marketCostMax: 336, diyHoursMin: 1.5, diyHoursMax: 3, postWorkshop: "Go to the Georgia Corporations Division site (sos.ga.gov). Upload your Articles PDF. Pay the $100 filing fee with a card. Approval email arrives in 5–7 business days." },
  { stageN: 1, stageLabel: "Form", deliverable: "EIN issued in-session", marketCostMin: 0, marketCostMax: 185, diyHoursMin: 1, diyHoursMax: 1.5 },
  { stageN: 1, stageLabel: "Form", deliverable: "Terms of Service, Privacy Policy & Service Agreement — customized", marketCostMin: 168, marketCostMax: 630, diyHoursMin: 2.5, diyHoursMax: 4, postWorkshop: "Save the 3 PDFs to Google Drive. Link Terms + Privacy in your website footer. Email the Service Agreement to your first customer to sign." },
  { stageN: 1, stageLabel: "Form", deliverable: "Business bank + local license + sales-tax checklist", marketCostMin: 62, marketCostMax: 62, diyHoursMin: 1, diyHoursMax: 1, postWorkshop: "Walk into your bank with your EIN letter + LLC packet to open the business account. Apply for your city business license online ($50–$75). Register for sales tax at dor.georgia.gov if you sell products." },
  { stageN: 1, stageLabel: "Form", deliverable: "Funding model & 12-month runway — costs, margin, break-even, monthly cash plan", marketCostMin: 600, marketCostMax: 1500, diyHoursMin: 6, diyHoursMax: 10 },
  { stageN: 1, stageLabel: "Form", deliverable: "Business plan with pro formas — narrative plan plus 12-month P&L, cash flow, and break-even pro forma a bank or investor will accept", marketCostMin: 900, marketCostMax: 2500, diyHoursMin: 8, diyHoursMax: 14 },
  { stageN: 1, stageLabel: "Form", deliverable: "Investor-ready pitch deck — 10 slides in your brand", marketCostMin: 750, marketCostMax: 2500, diyHoursMin: 6, diyHoursMax: 12 },
  { stageN: 1, stageLabel: "Form", deliverable: "Fundraising kit — 1-page raise summary, funder outreach plan + email template, grants/microloans/SBA path", marketCostMin: 400, marketCostMax: 1200, diyHoursMin: 4, diyHoursMax: 8 },

  { stageN: 2, stageLabel: "Customer", deliverable: "1-page Ideal Customer Profile + 25-name prospect list", marketCostMin: 375, marketCostMax: 375, diyHoursMin: 4.5, diyHoursMax: 4.5 },
  { stageN: 2, stageLabel: "Customer", deliverable: "Competitive research pack — 3 competitors on offer/price/positioning, customer quotes, and a 'what makes you different' one-pager", marketCostMin: 225, marketCostMax: 225, diyHoursMin: 3, diyHoursMax: 3 },
  { stageN: 2, stageLabel: "Customer", deliverable: "Competitive advantage brief — your 'secret sauce' distilled from research + competitor scan into a positioning line you can defend", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3, diyHoursMax: 3 },

  { stageN: 3, stageLabel: "Offer", deliverable: "One-sentence offer + first-version scope of work", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3, diyHoursMax: 3 },
  { stageN: 3, stageLabel: "Offer", deliverable: "Competitor + value-based pricing — competitor price scan, value/cost-plus anchors, margin & break-even", marketCostMin: 350, marketCostMax: 350, diyHoursMin: 3.5, diyHoursMax: 3.5 },

  { stageN: 4, stageLabel: "Build", deliverable: "Sale-to-delivery workflow map + tooling set up", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3.5, diyHoursMax: 3.5 },
  { stageN: 4, stageLabel: "Build", deliverable: "First customer's deliverable drafted + 5-point QA checklist", marketCostMin: 375, marketCostMax: 375, diyHoursMin: 4.5, diyHoursMax: 4.5 },
  { stageN: 4, stageLabel: "Build", deliverable: "Operations & workflow — 3 SOPs (intake, fulfillment, onboarding) + 1-page weekly operating rhythm", marketCostMin: 450, marketCostMax: 900, diyHoursMin: 5, diyHoursMax: 8 },
  { stageN: 4, stageLabel: "Build", deliverable: "Sourcing & staffing plan — where to source raw goods, services, and talent (suppliers, contractors, hires) with named candidates and a first-call list", marketCostMin: 400, marketCostMax: 900, diyHoursMin: 4, diyHoursMax: 8 },


  { stageN: 5, stageLabel: "Brand", deliverable: "Logo + 4-color palette + font pairing", marketCostMin: 210, marketCostMax: 1050, diyHoursMin: 4, diyHoursMax: 8.5, postWorkshop: "Download the logo ZIP. Upload it to your website, email signature, and social profiles. Keep the brand sheet PDF — hand it to anyone making things for you." },
  { stageN: 5, stageLabel: "Brand", deliverable: "Complete 4-page website — branded, written, SEO-configured", marketCostMin: 840, marketCostMax: 2520, diyHoursMin: 8.5, diyHoursMax: 17, postWorkshop: "Click Publish in the site builder. Buy your domain (~$12/yr) and connect it — the builder walks you through it step by step. Site goes live in about 30 minutes." },
  { stageN: 5, stageLabel: "Brand", deliverable: "Stripe / Square + GA4 + business email configured", marketCostMin: 126, marketCostMax: 126, diyHoursMin: 1.5, diyHoursMax: 1.5, postWorkshop: "Finish Stripe verification (bank routing + SSN, ~5 min). Verify your business email by clicking the link they send. GA4 is already tracking — just log in weekly to check visits." },

  { stageN: 6, stageLabel: "Marketing", deliverable: "Headline, 3 value props, 30-second pitch", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3.5, diyHoursMax: 3.5 },
  { stageN: 6, stageLabel: "Marketing", deliverable: "Business card + flyer — print-ready files", marketCostMin: 104, marketCostMax: 104, diyHoursMin: 1.5, diyHoursMax: 1.5, postWorkshop: "Upload the print-ready PDFs to Vistaprint or Moo. 500 business cards ≈ $25, 100 flyers ≈ $40. Arrives in 5–7 days." },
  { stageN: 6, stageLabel: "Marketing", deliverable: "Marketing & communications — audience, channels, messaging pillars, 30-day content calendar, 6 posts + 60s video script", marketCostMin: 252, marketCostMax: 252, diyHoursMin: 3, diyHoursMax: 3, postWorkshop: "Post one item every 2 days using the schedule we built. Film the 60-second video on your phone using the script — one take is fine. Done beats perfect." },

  { stageN: 7, stageLabel: "Launch", deliverable: "Go-to-market — target segment, channel mix, week-by-week tactics, 30/60/90 plan, 25-name list + 10 outreach drafts", marketCostMin: 375, marketCostMax: 375, diyHoursMin: 4.5, diyHoursMax: 4.5 },
  { stageN: 7, stageLabel: "Launch", deliverable: "Day-of timeline + CRM set up + 3 KPIs to track", marketCostMin: 126, marketCostMax: 126, diyHoursMin: 1, diyHoursMax: 1, postWorkshop: "Log in to the CRM each Monday and add every new lead. Check your 3 KPIs every Friday — that's it." },

];

export const VALUE_TOTALS = VALUE_ROWS.reduce(
  (acc, r) => ({
    costMin: acc.costMin + r.marketCostMin,
    costMax: acc.costMax + r.marketCostMax,
    hoursMin: acc.hoursMin + r.diyHoursMin,
    hoursMax: acc.hoursMax + r.diyHoursMax,
  }),
  { costMin: 0, costMax: 0, hoursMin: 0, hoursMax: 0 },
);

export const PRICING = {
  founders: { price: 679, label: "Founders Seat", subtitle: "First 4 to register", seats: 7 },
  cohort: { price: 997, label: "Cohort Seat", subtitle: "Next 7 seats", seats: 13 },
} as const;

export type TierKey = keyof typeof PRICING;

export const formatMoney = (n: number) =>
  n === 0 ? "$0" : `$${n.toLocaleString("en-US")}`;

export const formatCostRange = (min: number, max: number) =>
  min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`;

export const formatHoursRange = (min: number, max: number) =>
  min === max ? `${min} hrs` : `${min}–${max} hrs`;
