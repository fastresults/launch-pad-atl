export type Task = {
  title: string;
  deliverable: string;
  tool: string;
};

export type Stage = {
  n: number;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  oneLiner: string;
  duration: string;
  tasks: [Task, Task, Task];
};

export const STAGES: Stage[] = [
  {
    n: 1,
    slug: "form",
    title: "Form the business",
    shortTitle: "form",
    summary: "The legal foundation. Leave with a real entity you can sell from.",
    oneLiner: "Legal foundation",
    duration: "60 min",
    tasks: [
      {
        title: "Choose structure & register the entity",
        deliverable: "Articles of Organization submitted (GA LLC)",
        tool: "GA Secretary of State filing walk-through",
      },
      {
        title: "Get your EIN & open a business bank account",
        deliverable: "EIN issued + bank application started",
        tool: "IRS EIN portal + banking checklist",
      },
      {
        title: "Lock the compliance basics",
        deliverable: "Registered agent, GA license, sales tax, bookkeeping",
        tool: "GA compliance checklist",
      },
    ],
  },
  {
    n: 2,
    slug: "customer",
    title: "Customer & market",
    shortTitle: "customer",
    summary: "Who you serve, what they'll pay for, and proof the market is real.",
    oneLiner: "Demand & proof",
    duration: "60 min",
    tasks: [
      {
        title: "Pick one beachhead customer",
        deliverable: "One-page customer profile",
        tool: "Customer profile worksheet",
      },
      {
        title: "Name the top-3 pains + willingness to pay",
        deliverable: "Pain list with a dollar figure",
        tool: "Validation script + 5-call sprint",
      },
      {
        title: "Size the market & map 3 competitors",
        deliverable: "Market & competitor one-pager",
        tool: "Market snapshot template",
      },
    ],
  },
  {
    n: 3,
    slug: "offer",
    title: "Offer & product",
    shortTitle: "offer",
    summary: "What you actually sell, how it's delivered, and the price tag.",
    oneLiner: "Offer & pricing",
    duration: "60 min",
    tasks: [
      {
        title: "Write the offer in one sentence",
        deliverable: "Signed-off offer sentence",
        tool: "Offer-builder template",
      },
      {
        title: "Define the V1 deliverable & fulfillment",
        deliverable: "V1 scope + 1-page SOP",
        tool: "MVP scope canvas + fulfillment SOP",
      },
      {
        title: "Set price, margin & payment terms",
        deliverable: "Pricing sheet + break-even units",
        tool: "Pricing & margin calculator",
      },
    ],
  },
  {
    n: 4,
    slug: "brand",
    title: "Brand & web presence",
    shortTitle: "brand",
    summary: "Identity plus the digital storefront customers will judge you on.",
    oneLiner: "Identity & web",
    duration: "75 min",
    tasks: [
      {
        title: "Name, domain, basic brand kit",
        deliverable: "Live domain + brand kit folder",
        tool: "Domain check + AI brand kit",
      },
      {
        title: "Publish a one-page sales site",
        deliverable: "Published URL with your offer",
        tool: "Landing page builder",
      },
      {
        title: "Wire email, capture, payments, analytics",
        deliverable: "Test lead + test $1 transaction confirmed",
        tool: "Essentials setup checklist",
      },
    ],
  },
  {
    n: 5,
    slug: "marketing",
    title: "Marketing materials",
    shortTitle: "marketing",
    summary: "The assets that do the selling when you're not in the room.",
    oneLiner: "Sales assets",
    duration: "45 min",
    tasks: [
      {
        title: "Core messaging kit",
        deliverable: "Headline, value props, 30-sec pitch, bio",
        tool: "Messaging kit template",
      },
      {
        title: "Sales assets pack",
        deliverable: "Sell-sheet, social profiles, signature, card",
        tool: "Sales asset templates",
      },
      {
        title: "Outreach & content starter kit",
        deliverable: "5 outreach messages + 3 posts + 1 video script",
        tool: "Outreach + content templates",
      },
    ],
  },
  {
    n: 6,
    slug: "launch",
    title: "Launch plan",
    shortTitle: "launch",
    summary: "The dated, executable 30/60/90 you walk out with.",
    oneLiner: "30 / 60 / 90 plan",
    duration: "30 min",
    tasks: [
      {
        title: "The 30 / 60 / 90 launch plan",
        deliverable: "Signed 30/60/90 PDF (first 3 → 10 → repeatable channel)",
        tool: "Launch plan template",
      },
      {
        title: "First-week action board",
        deliverable: "10 dated actions for the next 7 days",
        tool: "Week-1 action board",
      },
      {
        title: "Accountability + metrics check-in",
        deliverable: "4 weekly check-ins booked + 3 metrics defined",
        tool: "Accountability pairing + weekly metrics sheet",
      },
    ],
  },
];

export const stageBySlug = (slug: string) => STAGES.find((s) => s.slug === slug);
