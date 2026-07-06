// Single source of truth for the venture-workspace section intros shown on
// /dashboard/hub/:snapshotId. Keep copy tight — this is what a first-time
// founder reads before touching anything.

export type SectionIntroCopy = {
  eyebrow: string;
  what: string;
  why: string;
  howTo: string[];
};

export const HUB_DASHBOARD_INTROS: Record<
  "next_action" | "sprint" | "toolkit" | "library",
  SectionIntroCopy
> = {
  next_action: {
    eyebrow: "01 · Next action",
    what: "The single most important thing to generate right now.",
    why: "Removes decision paralysis — one click and the machine writes the next batch of your kit.",
    howTo: [
      "Click the primary button to generate what's up next.",
      "Watch the progress bar — assets stream in as they finish.",
      "Read each one the moment it lands; don't wait for the whole batch.",
    ],
  },
  sprint: {
    eyebrow: "02 · 14-Day Launch Method",
    what: "Anderson's proven 14-day sprint that turns a concept into a live business.",
    why: "Every asset in your kit maps to a specific day — so you know when to read it, not just what it is.",
    howTo: [
      "Click any day to see that day's assets and what to ship by end of day.",
      "Follow the days in order — each one builds on the last.",
      "Use the day deck as your morning briefing.",
    ],
  },
  toolkit: {
    eyebrow: "03 · AI Toolkit",
    what: "A personalized stack of AI tools chosen for your industry and workflow.",
    why: "Your 14-day plan assumes you have the right tools installed — this gets you set up in an afternoon.",
    howTo: [
      "Generate the stack, then open each tool to install it.",
      "Paste API keys as prompted so the rest of the assets can use them.",
      "Skip anything you already own — the checklist tracks progress.",
    ],
  },
  library: {
    eyebrow: "04 · Your asset library",
    what: "All 60+ founder-ready assets grouped into six tracks (Foundation → Growth).",
    why: "Sections unlock in order so you build in the right sequence — no writing ads before you have a brand.",
    howTo: [
      "Use 'Generate this section' to batch a whole track at once.",
      "Or hit Generate on any single asset for a one-off.",
      "Expand and collapse sections as you work through them.",
    ],
  },
};

export const HUB_WELCOME_COPY = {
  title: "This is your venture workspace",
  body:
    "Four things live here — your next action, a 14-day sprint plan, your AI toolkit, and 60+ founder-ready assets. Read the intro on each card, then start with the primary button up top.",
};
