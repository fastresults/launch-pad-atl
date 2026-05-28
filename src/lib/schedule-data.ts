export type Session = {
  time: string;
  duration: string;
  stage?: number;
  title: string;
  description: string;
  tools?: string[];
  kind?: "session" | "break";
};

export const EVENT = {
  dateLabel: "Thursday, July 23, 2026",
  timeLabel: "9:00 AM – 4:00 PM ET",
  venueName: "Workshop venue",
  address: "1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093",
  capacity: 20,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093",
};

export const FLOW_STAGES = [
  { n: 1, key: "ideate", title: "ideate", blurb: "Sharpen the idea & target customer." },
  { n: 2, key: "plan", title: "plan", blurb: "Validate, position, price." },
  { n: 3, key: "develop", title: "develop", blurb: "Brand, web presence, MVP." },
  { n: 4, key: "launch", title: "launch", blurb: "Go-to-market & first customers." },
  { n: 5, key: "grow", title: "grow", blurb: "Channels, retention, metrics." },
  { n: 6, key: "next", title: "next steps", blurb: "Your 30-day action plan." },
] as const;

export const SCHEDULE: Session[] = [
  {
    time: "9:00 AM",
    duration: "30 min",
    title: "Check-in & kickoff",
    description: "Coffee, intros, set up your laptop, share your idea in one sentence.",
    kind: "session",
  },
  {
    time: "9:30 AM",
    duration: "60 min",
    stage: 1,
    title: "Ideate — sharpen the idea",
    description:
      "Pin down the customer, the problem, and the smallest first version of your business worth building.",
    tools: ["Problem/solution canvas", "Customer profile worksheet"],
  },
  {
    time: "10:30 AM",
    duration: "60 min",
    stage: 2,
    title: "Plan — validate & price",
    description:
      "Test demand fast, draft your one-page business plan, decide pricing and unit economics.",
    tools: ["Lean canvas", "ROI / pricing calculator"],
  },
  {
    time: "11:30 AM",
    duration: "45 min",
    title: "Lunch break",
    description: "Lunch provided. Working tables open for questions.",
    kind: "break",
  },
  {
    time: "12:15 PM",
    duration: "75 min",
    stage: 3,
    title: "Develop — brand & web presence",
    description:
      "Pick a name, secure the domain, generate logo + brand kit, and stand up a landing page.",
    tools: ["Domain check", "AI brand kit", "Landing page builder"],
  },
  {
    time: "1:30 PM",
    duration: "60 min",
    stage: 4,
    title: "Launch — first customers",
    description:
      "Build your launch list, write outreach that converts, prep your offer & checkout.",
    tools: ["Outreach templates", "Stripe / payments setup"],
  },
  {
    time: "2:30 PM",
    duration: "15 min",
    title: "Coffee reset",
    description: "Quick stretch, refill, regroup.",
    kind: "break",
  },
  {
    time: "2:45 PM",
    duration: "45 min",
    stage: 5,
    title: "Grow — channels & metrics",
    description: "Pick 2 acquisition channels, define the metrics that matter for week 1.",
    tools: ["Channel scorecard", "Weekly metrics sheet"],
  },
  {
    time: "3:30 PM",
    duration: "30 min",
    stage: 6,
    title: "Next steps — 30-day plan",
    description:
      "Leave with a dated 30-day plan, accountability partner, and a follow-up check-in.",
    tools: ["30-day plan", "Accountability pairing"],
  },
];
