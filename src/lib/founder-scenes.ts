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
import sceneAutoAuction from "@/assets/scenes/scene-autoauction.jpg";
import sceneDaycare from "@/assets/scenes/scene-daycare.jpg";
import sceneSeniorCare from "@/assets/scenes/scene-seniorcare.jpg";
import sceneHomeHealth from "@/assets/scenes/scene-homehealth.jpg";
import sceneTrucking from "@/assets/scenes/scene-trucking.jpg";
import sceneFoodTruck from "@/assets/scenes/scene-foodtruck.jpg";
import scenePetGrooming from "@/assets/scenes/scene-petgrooming.jpg";
import sceneJunkHauling from "@/assets/scenes/scene-junkhauling.jpg";
import scenePressureWashing from "@/assets/scenes/scene-pressurewashing.jpg";
import sceneGhostKitchen from "@/assets/scenes/scene-ghostkitchen.jpg";
import sceneNotary from "@/assets/scenes/scene-notary.jpg";
import scenePickleball from "@/assets/scenes/scene-pickleball.jpg";
import sceneHolidayLights from "@/assets/scenes/scene-holidaylights.jpg";
import sceneOrganizing from "@/assets/scenes/scene-organizing.jpg";
import sceneVending from "@/assets/scenes/scene-vending.jpg";
import sceneHandyman from "@/assets/scenes/scene-handyman.jpg";
import sceneEpoxy from "@/assets/scenes/scene-epoxy.jpg";
import sceneLawnCare from "@/assets/scenes/scene-lawncare.jpg";
import sceneAirbnb from "@/assets/scenes/scene-airbnb.jpg";
import sceneMobileIv from "@/assets/scenes/scene-mobileiv.jpg";
import sceneSeniorTech from "@/assets/scenes/scene-seniortech.jpg";
import sceneMealPrep from "@/assets/scenes/scene-mealprep.jpg";
import sceneBookkeeping from "@/assets/scenes/scene-bookkeeping.jpg";
import sceneResume from "@/assets/scenes/scene-resume.jpg";
import sceneMicrogreens from "@/assets/scenes/scene-microgreens.jpg";
import sceneDogWalking from "@/assets/scenes/scene-dogwalking.jpg";
import sceneAiAutomation from "@/assets/scenes/scene-aiautomation.jpg";
import sceneContentStudio from "@/assets/scenes/scene-contentstudio.jpg";
import sceneNewsletter from "@/assets/scenes/scene-newsletter.jpg";
import sceneDigitalProducts from "@/assets/scenes/scene-digitalproducts.jpg";
import sceneMerch from "@/assets/scenes/scene-merch.jpg";
import sceneOnlineReseller from "@/assets/scenes/scene-onlinereseller.jpg";
import sceneVirtualAssistant from "@/assets/scenes/scene-virtualassistant.jpg";
import sceneOnlineCoaching from "@/assets/scenes/scene-onlinecoaching.jpg";
import sceneLeadGen from "@/assets/scenes/scene-leadgen.jpg";
import sceneSubscriptionBox from "@/assets/scenes/scene-subscriptionbox.jpg";

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
  {
    id: "autoauction",
    phrase: "I want to be an auto auction consultant",
    label: "Auto auction consulting",
    image: sceneAutoAuction,
    alt: "Auto auction consultant walking the lot at dusk with a clipboard",
  },
  {
    id: "daycare",
    phrase: "I want to open a daycare",
    label: "Daycare",
    image: sceneDaycare,
    alt: "Daycare owner setting up her classroom before the children arrive",
  },
  {
    id: "seniorcare",
    phrase: "I want to start a senior aging consultancy",
    label: "Senior care consulting",
    image: sceneSeniorCare,
    alt: "Senior care consultant reviewing options with an older client at his kitchen table",
  },
  {
    id: "homehealth",
    phrase: "I want to start a home health care agency",
    label: "Home health agency",
    image: sceneHomeHealth,
    alt: "Home health agency founder and a caregiver in a client's living room",
  },
  {
    id: "trucking",
    phrase: "I want to start a trucking company",
    label: "Trucking company",
    image: sceneTrucking,
    alt: "Trucking company founder beside his first rig at the depot at blue hour",
  },
  {
    id: "foodtruck",
    phrase: "I want to launch a food truck",
    label: "Food truck",
    image: sceneFoodTruck,
    alt: "Food truck owner leaning out the service window on a busy night",
  },
  {
    id: "petgrooming",
    phrase: "I want to start a mobile pet grooming van",
    label: "Mobile pet grooming",
    image: scenePetGrooming,
    alt: "Mobile pet groomer working with a dog inside her van in a suburban driveway",
  },
  {
    id: "junkhauling",
    phrase: "I want to start a junk hauling business",
    label: "Junk hauling",
    image: sceneJunkHauling,
    alt: "Junk hauling crew loading old furniture into a dump trailer",
  },
  {
    id: "pressurewashing",
    phrase: "I want to start a pressure washing company",
    label: "Pressure washing",
    image: scenePressureWashing,
    alt: "Pressure washing contractor cleaning a commercial walkway in morning light",
  },
  {
    id: "ghostkitchen",
    phrase: "I want to launch a ghost kitchen brand",
    label: "Ghost kitchen",
    image: sceneGhostKitchen,
    alt: "Founder plating delivery orders in a small shared ghost kitchen",
  },
  {
    id: "notary",
    phrase: "I want to become a mobile notary and loan signing agent",
    label: "Mobile notary",
    image: sceneNotary,
    alt: "Mobile notary walking a couple through closing paperwork at their kitchen table",
  },
  {
    id: "pickleball",
    phrase: "I want to teach pickleball clinics",
    label: "Pickleball clinics",
    image: scenePickleball,
    alt: "Pickleball coach running a beginner clinic on an outdoor court",
  },
  {
    id: "holidaylights",
    phrase: "I want to start a Christmas light install business",
    label: "Holiday light install",
    image: sceneHolidayLights,
    alt: "Installer hanging warm holiday lights along a roofline at dusk",
  },
  {
    id: "organizing",
    phrase: "I want to start a home organization service",
    label: "Home organizing",
    image: sceneOrganizing,
    alt: "Professional organizer arranging baskets and linens in a bright pantry",
  },
  {
    id: "vending",
    phrase: "I want to run a vending machine route",
    label: "Vending route",
    image: sceneVending,
    alt: "Vending route operator restocking a machine in an office lobby",
  },
  {
    id: "handyman",
    phrase: "I want to build a two-truck handyman crew",
    label: "Handyman crew",
    image: sceneHandyman,
    alt: "Two handyman crew members reviewing the day's job list between work trucks",
  },
  {
    id: "epoxy",
    phrase: "I want to start an epoxy garage floor business",
    label: "Epoxy garage floors",
    image: sceneEpoxy,
    alt: "Contractor rolling a glossy epoxy coating across a residential garage floor",
  },
  {
    id: "lawncare",
    phrase: "I want to start a lawn care route",
    label: "Lawn care route",
    image: sceneLawnCare,
    alt: "Lawn care owner mowing a suburban yard with his trailer parked at the curb",
  },
  {
    id: "airbnb",
    phrase: "I want to manage short-term rentals",
    label: "Short-term rental management",
    image: sceneAirbnb,
    alt: "Couple turning over a short-term rental with fresh linens and bookings on a laptop",
  },
  {
    id: "mobileiv",
    phrase: "I want to start a mobile IV and wellness service",
    label: "Mobile IV wellness",
    image: sceneMobileIv,
    alt: "Mobile IV nurse setting up a wellness drip for a client at home",
  },
  {
    id: "seniortech",
    phrase: "I want to start a senior tech help service",
    label: "Senior tech help",
    image: sceneSeniorTech,
    alt: "Tech helper showing an older woman how to use her tablet at her kitchen table",
  },
  {
    id: "mealprep",
    phrase: "I want to start a weekly meal prep service",
    label: "Weekly meal prep",
    image: sceneMealPrep,
    alt: "Meal prep founder packing containers of cooked meals on a kitchen island",
  },
  {
    id: "bookkeeping",
    phrase: "I want to start a bookkeeping business",
    label: "Bookkeeping service",
    image: sceneBookkeeping,
    alt: "Bookkeeper reviewing numbers on a laptop with a barbershop owner",
  },
  {
    id: "resume",
    phrase: "I want to start a resume and LinkedIn service",
    label: "Resume & LinkedIn rewrites",
    image: sceneResume,
    alt: "Resume writer on a client video call at a tidy home desk",
  },
  {
    id: "microgreens",
    phrase: "I want to grow microgreens for chefs",
    label: "Microgreens farm",
    image: sceneMicrogreens,
    alt: "Grower harvesting trays of microgreens in a small garage grow room",
  },
  {
    id: "dogwalking",
    phrase: "I want to start a dog walking and pet sitting business",
    label: "Dog walking & pet sitting",
    image: sceneDogWalking,
    alt: "Dog walker leading three dogs down a tree-lined neighborhood sidewalk",
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

