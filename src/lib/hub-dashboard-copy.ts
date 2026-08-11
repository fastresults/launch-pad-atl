// Single source of truth for the venture-workspace section intros shown on
// /dashboard/hub/:snapshotId. Kept intentionally sparse — the eyebrow row is
// a one-line label; the "why + how" bullets live inside the popover so they
// don't compete with the section's own component underneath.

export type SectionIntroCopy = {
  eyebrow: string;
  why: string;
  howTo: string[];
};

export const HUB_DASHBOARD_INTROS: Record<
  "sprint" | "toolkit" | "library",
  SectionIntroCopy
> = {
  sprint: {
    eyebrow: "01 · 14-Day Pivot Method",
    why: "The proven 14-day pivot — every asset in your kit maps to a specific day, so you know when to read it, not just what it is.",
    howTo: [
      "Click any day to see that day's assets and what to ship by end of day.",
      "Follow the days in order — each one builds on the last.",
      "Use the day deck as your morning briefing.",
    ],
  },
  toolkit: {
    eyebrow: "02 · Operating Tool Stack",
    why: "The named tools your business runs on, chosen for your industry. Your 14-day plan assumes you have these set up — this gets you there in an afternoon.",
    howTo: [
      "Generate the stack, then open each tool to install it.",
      "Connect each account so the rest of the assets can use it.",
      "Skip anything you already own — the checklist tracks progress.",
    ],
  },
  library: {
    eyebrow: "03 · Your asset library",
    why: "All 60+ founder-ready assets grouped into six tracks (Foundation → Growth). Sections unlock in order so you build in the right sequence.",
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
    "Three things live here — your 14-day sprint plan, your operating tool stack, and 60+ founder-ready assets. Read each section eyebrow, then start with the primary button up top.",
};
