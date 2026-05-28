export type ValueRow = {
  stageN: number;
  stageLabel: string;
  deliverable: string;
  marketCostMin: number;
  marketCostMax: number;
  diyHoursMin: number;
  diyHoursMax: number;
};

export const VALUE_ROWS: ValueRow[] = [
  { stageN: 1, stageLabel: "Form", deliverable: "GA LLC filing packet — Articles pre-filled, registered agent set", marketCostMin: 225, marketCostMax: 600, diyHoursMin: 3, diyHoursMax: 6 },
  { stageN: 1, stageLabel: "Form", deliverable: "EIN issued in-session", marketCostMin: 0, marketCostMax: 185, diyHoursMin: 1, diyHoursMax: 1.5 },
  { stageN: 1, stageLabel: "Form", deliverable: "Terms of Service, Privacy Policy & Service Agreement — customized", marketCostMin: 300, marketCostMax: 1125, diyHoursMin: 4.5, diyHoursMax: 7.5 },
  { stageN: 1, stageLabel: "Form", deliverable: "Business bank + local license + sales-tax checklist", marketCostMin: 110, marketCostMax: 110, diyHoursMin: 2, diyHoursMax: 2 },

  { stageN: 2, stageLabel: "Customer", deliverable: "1-page Ideal Customer Profile + 25-name prospect list", marketCostMin: 375, marketCostMax: 375, diyHoursMin: 4.5, diyHoursMax: 4.5 },
  { stageN: 2, stageLabel: "Customer", deliverable: "Outreach script + 3-competitor positioning grid", marketCostMin: 225, marketCostMax: 225, diyHoursMin: 3, diyHoursMax: 3 },

  { stageN: 3, stageLabel: "Offer", deliverable: "One-sentence offer + scope of work + pricing sheet", marketCostMin: 560, marketCostMax: 560, diyHoursMin: 6, diyHoursMax: 6 },

  { stageN: 4, stageLabel: "Build", deliverable: "Sale-to-delivery workflow map + tooling set up", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3.5, diyHoursMax: 3.5 },
  { stageN: 4, stageLabel: "Build", deliverable: "First customer's deliverable drafted + 5-point QA checklist", marketCostMin: 375, marketCostMax: 375, diyHoursMin: 4.5, diyHoursMax: 4.5 },

  { stageN: 5, stageLabel: "Brand", deliverable: "Logo + 4-color palette + font pairing", marketCostMin: 375, marketCostMax: 1875, diyHoursMin: 7.5, diyHoursMax: 15 },
  { stageN: 5, stageLabel: "Brand", deliverable: "Complete 4-page website — branded, written, SEO-configured", marketCostMin: 1500, marketCostMax: 4500, diyHoursMin: 15, diyHoursMax: 30 },
  { stageN: 5, stageLabel: "Brand", deliverable: "Stripe / Square + GA4 + business email configured", marketCostMin: 225, marketCostMax: 225, diyHoursMin: 3, diyHoursMax: 3 },

  { stageN: 6, stageLabel: "Marketing", deliverable: "Headline, 3 value props, 30-second pitch", marketCostMin: 300, marketCostMax: 300, diyHoursMin: 3.5, diyHoursMax: 3.5 },
  { stageN: 6, stageLabel: "Marketing", deliverable: "Business card + flyer — print-ready files", marketCostMin: 185, marketCostMax: 185, diyHoursMin: 3, diyHoursMax: 3 },
  { stageN: 6, stageLabel: "Marketing", deliverable: "6 social posts + 60-second video script + 30-day plan", marketCostMin: 450, marketCostMax: 450, diyHoursMin: 6, diyHoursMax: 6 },

  { stageN: 7, stageLabel: "Launch", deliverable: "30/60/90 launch plan + 25-name list + 10 outreach drafts", marketCostMin: 375, marketCostMax: 375, diyHoursMin: 4.5, diyHoursMax: 4.5 },
  { stageN: 7, stageLabel: "Launch", deliverable: "Day-of timeline + CRM set up + 3 KPIs to track", marketCostMin: 225, marketCostMax: 225, diyHoursMin: 2, diyHoursMax: 2 },
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
  founders: { price: 679, label: "Founders Seat", subtitle: "First 7 to register", seats: 7 },
  cohort: { price: 997, label: "Cohort Seat", subtitle: "Next 13 seats", seats: 13 },
} as const;

export type TierKey = keyof typeof PRICING;

export const formatMoney = (n: number) =>
  n === 0 ? "$0" : `$${n.toLocaleString("en-US")}`;

export const formatCostRange = (min: number, max: number) =>
  min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`;

export const formatHoursRange = (min: number, max: number) =>
  min === max ? `${min} hrs` : `${min}–${max} hrs`;
