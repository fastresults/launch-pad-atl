import sceneCoffee from "@/assets/scenes/scene-coffee.jpg";
import sceneRoofing from "@/assets/scenes/scene-roofing.jpg";
import sceneRestaurant from "@/assets/scenes/scene-restaurant.jpg";
import sceneEcommerce from "@/assets/scenes/scene-ecommerce.jpg";
import sceneMatchmaking from "@/assets/scenes/scene-matchmaking.jpg";
import sceneFitness from "@/assets/scenes/scene-fitness.jpg";
import sceneLandscaping from "@/assets/scenes/scene-landscaping.jpg";
import sceneBakery from "@/assets/scenes/scene-bakery.jpg";
import scenePhotography from "@/assets/scenes/scene-photography.jpg";
import sceneCleaning from "@/assets/scenes/scene-cleaning.jpg";
import sceneBranding from "@/assets/scenes/scene-branding.jpg";
import sceneMedspa from "@/assets/scenes/scene-medspa.jpg";
import sceneDetailing from "@/assets/scenes/scene-detailing.jpg";
import sceneBoutique from "@/assets/scenes/scene-boutique.jpg";
import sceneRealEstate from "@/assets/scenes/scene-realestate.jpg";

export type FounderScene = {
  id: string;
  phrase: string;
  label: string;
  image: string;
  alt: string;
};

export const founderScenes: FounderScene[] = [
  {
    id: "coffee",
    phrase: "I want to start a coffee shop",
    label: "Coffee shop",
    image: sceneCoffee,
    alt: "Coffee shop founder behind the espresso bar at golden hour",
  },
  {
    id: "roofing",
    phrase: "I want to build a roofing company",
    label: "Roofing company",
    image: sceneRoofing,
    alt: "Roofing contractor founder on a residential rooftop with his crew",
  },
  {
    id: "restaurant",
    phrase: "I want to open a neighborhood restaurant",
    label: "Restaurant",
    image: sceneRestaurant,
    alt: "Restaurant founder plating a dish at the kitchen pass",
  },
  {
    id: "ecommerce",
    phrase: "I want to launch an online shopping brand",
    label: "Online shopping brand",
    image: sceneEcommerce,
    alt: "Ecommerce founder packing orders in a small warehouse",
  },
  {
    id: "matchmaking",
    phrase: "I want to build a platform that matches people",
    label: "Matching platform",
    image: sceneMatchmaking,
    alt: "Community platform founder hosting an evening meetup",
  },
  {
    id: "fitness",
    phrase: "I want to open a fitness studio",
    label: "Fitness studio",
    image: sceneFitness,
    alt: "Fitness studio founder standing in the studio before class",
  },
  {
    id: "landscaping",
    phrase: "I want to start a landscaping service",
    label: "Landscaping service",
    image: sceneLandscaping,
    alt: "Landscaping founder beside a work truck at dawn",
  },
  {
    id: "bakery",
    phrase: "I want to open a bakery",
    label: "Bakery",
    image: sceneBakery,
    alt: "Bakery founder pulling trays of bread from the oven before dawn",
  },
  {
    id: "photography",
    phrase: "I want to build a photography studio",
    label: "Photography studio",
    image: scenePhotography,
    alt: "Photography studio founder adjusting a light on set",
  },
  {
    id: "cleaning",
    phrase: "I want to start a home cleaning company",
    label: "Home cleaning company",
    image: sceneCleaning,
    alt: "Home cleaning company founder with supplies and a van at dawn",
  },
  {
    id: "branding",
    phrase: "I want to start a personal branding studio",
    label: "Personal branding studio",
    image: sceneBranding,
    alt: "Personal branding studio founder on a lit content set",
  },
  {
    id: "medspa",
    phrase: "I want to open a med spa",
    label: "Med spa",
    image: sceneMedspa,
    alt: "Med spa founder standing in a calm treatment room",
  },
  {
    id: "detailing",
    phrase: "I want to start a mobile detailing company",
    label: "Mobile detailing company",
    image: sceneDetailing,
    alt: "Mobile detailing founder polishing a car at dusk beside a van",
  },
  {
    id: "boutique",
    phrase: "I want to open a boutique clothing shop",
    label: "Boutique clothing shop",
    image: sceneBoutique,
    alt: "Boutique owner arranging racks in a warmly lit shop",
  },
  {
    id: "realestate",
    phrase: "I want to start a real estate brokerage",
    label: "Real estate brokerage",
    image: sceneRealEstate,
    alt: "Real estate brokerage founder in a modern listing at twilight",
  },
];

const LAST_FIRST_SCENE_KEY = "hero-last-first-scene";

/**
 * Fisher-Yates shuffle — new random order on every call. When `avoidFirstId` is
 * given, the opening scene is guaranteed not to be that one.
 */
export function shuffleScenes(
  scenes: FounderScene[] = founderScenes,
  avoidFirstId?: string,
): FounderScene[] {
  const copy = [...scenes];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }

  if (avoidFirstId && copy.length > 1 && copy[0]?.id === avoidFirstId) {
    const swap = 1 + Math.floor(Math.random() * (copy.length - 1));
    [copy[0], copy[swap]] = [copy[swap]!, copy[0]!];
  }

  return copy;
}

/**
 * Shuffles the scenes and remembers the opening scene so the next visit in this
 * session never starts on the same image.
 */
export function shuffleScenesForVisit(
  scenes: FounderScene[] = founderScenes,
): FounderScene[] {
  let last: string | undefined;
  try {
    last = window.sessionStorage.getItem(LAST_FIRST_SCENE_KEY) ?? undefined;
  } catch {
    last = undefined;
  }

  const ordered = shuffleScenes(scenes, last);

  try {
    if (ordered[0]) {
      window.sessionStorage.setItem(LAST_FIRST_SCENE_KEY, ordered[0].id);
    }
  } catch {
    /* storage unavailable — ordering is still random */
  }

  return ordered;
}

