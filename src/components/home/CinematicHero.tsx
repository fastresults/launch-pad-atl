import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { founderScenes, shuffleScenesForVisit } from "@/lib/founder-scenes";
import { getWorkshopScenes, shuffleWorkshopScenes } from "@/lib/workshop-scenes";
import { useSceneCycle } from "@/hooks/use-scene-cycle";
import { IdeaPrompt } from "@/components/home/IdeaPrompt";
import { WorkshopRail } from "@/components/home/WorkshopRail";
import { WorkshopGatewaySheet } from "@/components/home/WorkshopGatewaySheet";
import { useSelectedWorkshop } from "@/hooks/use-selected-workshop";
import { FOUNDATION_SLUG } from "@/lib/workshop-catalog";

/**
 * Full-viewport cinematic hero: photographic founder scenes cross-fading with a
 * slow drift, atmospheric haze, and a glass prompt in the lower third. The
 * workshop rail under the prompt re-tunes the question the hero asks.
 */
export function CinematicHero() {
  const [paused, setPaused] = useState(false);
  const takeOver = useCallback(() => setPaused(true), []);
  const [cueHidden, setCueHidden] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const { workshop, select } = useSelectedWorkshop();
  const isFoundation = workshop.slug === FOUNDATION_SLUG;

  // Foundation rotates the founder business library ("Now building: Bakery").
  // Every other workshop rotates its own ten pain images ("Now fixing: …"), and
  // falls back to the founder set until those images exist.
  const painScenes = isFoundation ? null : getWorkshopScenes(workshop.slug);
  const isPainRotation = painScenes !== null;

  const scenes = useMemo<HeroScene[]>(() => {
    if (painScenes) {
      return shuffleWorkshopScenes(painScenes).map((scene) => ({
        ...scene,
        phrase: scene.label,
      }));
    }
    return shuffleScenesForVisit(founderScenes);
    // The workshop slug is what actually changes the set; painScenes is derived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFoundation, workshop.slug]);

  const phrases = useMemo(() => scenes.map((scene) => scene.phrase), [scenes]);
  const { typed, index } = useSceneCycle(phrases, !paused);

  // Non-foundation workshops ghost-type their own examples instead of the
  // scene phrases.
  const { typed: workshopTyped } = useSceneCycle(
    workshop.promptExamples,
    !paused && !isFoundation,
  );
  const ghostText = isFoundation ? typed : workshopTyped;

  const total = scenes.length;
  // Only three images are ever mounted: the one fading out, the one on screen,
  // and the next one (already decoded, waiting at opacity 0). Mounting all 107
  // decodes hundreds of MB of bitmaps and promotes a compositor layer per image.
  const window3 = useMemo(() => {
    if (total === 0) return [] as Array<{ scene: (typeof scenes)[number]; offset: number }>;
    return [-1, 0, 1]
      .map((offset) => ({
        scene: scenes[(index + offset + total) % total]!,
        offset,
      }))
      .filter(
        (entry, position, list) =>
          list.findIndex((other) => other.scene.id === entry.scene.id) === position,
      );
  }, [index, scenes, total]);

  // Decode the upcoming scene off-screen so the crossfade never begins against
  // an undecoded bitmap.
  useEffect(() => {
    if (total === 0) return;
    const next = scenes[(index + 1) % total];
    if (!next) return;
    const img = new Image();
    img.src = next.image;
    void img.decode?.().catch(() => undefined);
  }, [index, scenes, total]);

  useEffect(() => {
    const onScroll = () => setCueHidden(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToNext = useCallback(() => {
    const target = document.getElementById("learn-more");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    }
  }, []);

  return (
    <section className="sl-hero">
      <div className="sl-hero__media" aria-hidden="true">
        {window3.map(({ scene, offset }) => (
          <img
            key={scene.id}
            src={scene.image}
            alt={offset === 0 ? scene.alt : ""}
            aria-hidden={offset === 0 ? undefined : true}
            data-active={offset === 0}
            data-leaving={offset === -1 || undefined}
            width={1536}
            height={1024}
            loading="eager"
            decoding="async"
            fetchPriority={offset === 0 ? "high" : "low"}
            className="sl-hero__scene"
          />
        ))}
        <div className="sl-hero__scrim" />
        <div className="sl-hero__grain" />
      </div>


      <div className="sl-hero__stack">
        <p className="sl-hero__kicker">
          Atlanta · IGNITE Center at Greater Atlanta Christian School
        </p>
        <h1 className="sl-hero__title">{workshop.heroQuestion}</h1>
        <div className="sl-hero__prompt">
          <IdeaPrompt
            ghostText={ghostText}
            paused={paused}
            onTakeOver={takeOver}
            workshop={workshop}
          />
        </div>
        <WorkshopRail
          selected={workshop}
          onSelect={select}
          onOpenGateway={() => setGatewayOpen(true)}
        />
        {isFoundation && (
          <p className="sl-hero__status">
            Now building: <span>{scenes[index]?.label}</span>
          </p>
        )}
      </div>

      <WorkshopGatewaySheet open={gatewayOpen} onOpenChange={setGatewayOpen} onSelect={select} />

      <button
        type="button"
        onClick={scrollToNext}
        data-hidden={cueHidden || undefined}
        className="sl-hero__scroll-cue"
        aria-label="Scroll to content"
      >
        <span className="sl-hero__scroll-cue-label">Scroll</span>
        <span className="sl-hero__scroll-cue-dot">
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </span>
      </button>
    </section>
  );
}
