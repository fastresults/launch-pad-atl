import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import type { Slide } from "./SlideDeck";
import { foundationSlides } from "./slides/foundation";

export type StageDeck = {
  slug: string;
  title: string;
  stageNumber: string;
  available: boolean;
  slides: Slide[];
  nextSlug?: string;
};

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Build slug map from FRAMEWORK_STAGES so adding new decks is just authoring slides.
const STAGE_SLUGS = FRAMEWORK_STAGES.map((s) => slugify(s.name));

const DECK_SLIDES: Record<string, Slide[]> = {
  foundation: foundationSlides,
  // strategy, operations, finance, governance, brand, marketing, social-and-content — coming next.
};

export const STAGE_DECKS: StageDeck[] = FRAMEWORK_STAGES.map((s, i) => {
  const slug = STAGE_SLUGS[i];
  const slides = DECK_SLIDES[slug];
  return {
    slug,
    title: s.name,
    stageNumber: s.number,
    available: !!slides && slides.length > 0,
    slides: slides ?? [],
    nextSlug: STAGE_SLUGS[i + 1],
  };
});

export function getDeck(slug: string): StageDeck | undefined {
  return STAGE_DECKS.find((d) => d.slug === slug);
}
