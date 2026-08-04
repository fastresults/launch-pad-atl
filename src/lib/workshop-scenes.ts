import { getWorkshopPains, type WorkshopPain } from "@/lib/workshop-pains";

/**
 * A hero image for one workshop, tied to the pain it illustrates.
 * `label` is the subject of the "Now fixing: …" caption under the prompt.
 */
export type WorkshopScene = {
  id: string;
  image: string;
  label: string;
  alt: string;
  /** First-person question typed in the chat box while this image is up. */
  question?: string;
};


/**
 * Pain images live at src/assets/scenes/workshops/<slug>/<pain-id>.jpg. Globbing
 * them means a generated image joins the rotation the moment the file lands —
 * no import list to keep in sync — and a workshop with no images yet simply
 * falls back to the founder scene library.
 */
const SCENE_URLS = import.meta.glob<string>(
  "../assets/scenes/workshops/*/*.jpg",
  { eager: true, query: "?url", import: "default" },
);

/** slug -> pain id -> url */
const BY_SLUG: Record<string, Record<string, string>> = (() => {
  const map: Record<string, Record<string, string>> = {};
  for (const [path, url] of Object.entries(SCENE_URLS)) {
    const match = path.match(/\/workshops\/([^/]+)\/([^/]+)\.jpg$/);
    if (!match) continue;
    const [, slug, id] = match;
    (map[slug!] ??= {})[id!] = url;
  }
  return map;
})();

function toScene(pain: WorkshopPain, image: string): WorkshopScene {
  return {
    id: pain.id,
    image,
    label: pain.pain,
    alt: `${pain.pain} — the workshop fixes it with ${pain.fix}`,
    question: pain.question,
  };
}


/**
 * The pain-tied hero set for a workshop, or null when its images haven't been
 * generated yet (the hero then keeps the founder scene rotation).
 */
export function getWorkshopScenes(slug: string): WorkshopScene[] | null {
  const images = BY_SLUG[slug];
  if (!images) return null;
  const scenes = getWorkshopPains(slug)
    .filter((pain) => images[pain.id])
    .map((pain) => toScene(pain, images[pain.id]!));
  return scenes.length > 0 ? scenes : null;
}

/** Fisher-Yates, so the ten images open on a different pain every visit. */
export function shuffleWorkshopScenes(scenes: WorkshopScene[]): WorkshopScene[] {
  const copy = [...scenes];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
