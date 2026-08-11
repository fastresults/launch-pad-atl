// The one thing the foundation and the 120-day runway don't cover: software.
// A marketplace, a matching platform, a booking or membership product — that's
// a build, not a page. Priced from a floor, scoped on a call. Every number and
// every client-facing string lives here so it's tuned in one place.

/** Floor price for a platform build, in cents. Always spoken as "starts at". */
export const PLATFORM_FROM_CENTS = 375_000;

export const PLATFORM_COPY = {
  kicker: "Platform build — add-on",
  headline: "Your startup needs software, not just a site.",
  body:
    "Marketplaces, matching platforms, booking and membership products, operator dashboards — " +
    "anything where the product is the software. That's a build, not a page, so it sits outside " +
    "the 120-day runway.",
  price: "Platform builds start at $3,750, scoped and quoted after a short build call.",
  cta: "Talk to us about a platform build",
  /** Shown on the retained card's covered list. */
  retainedLine: "Platform builds (marketplace, matching, booking) quoted separately — from $3,750",
  requested: "Platform build requested — we'll reach out to book your build call.",
} as const;

/** The kinds of platform we build. Types, never features or timelines. */
export const PLATFORM_TYPES = [
  "Marketplace",
  "Matching platform",
  "Booking or scheduling",
  "Membership or portal",
  "Operator dashboard",
] as const;

/** What happens after they raise their hand — no dates, no scope promises. */
export const PLATFORM_NEXT_STEPS = [
  "A short build call to hear what the platform has to do",
  "A written scope of the first release",
  "A fixed quote, starting from $3,750",
] as const;

export interface PlatformRequest {
  id: string;
  snapshot_id: string;
  description: string;
  audience: string | null;
  deadline: string | null;
  contact: string | null;
  status: string;
  created_at: string;
}
