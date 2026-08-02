import { useCallback, useMemo, useState } from "react";
import { founderScenes, shuffleScenesForVisit } from "@/lib/founder-scenes";
import { useSceneCycle } from "@/hooks/use-scene-cycle";
import { IdeaPrompt } from "@/components/home/IdeaPrompt";

/**
 * Full-viewport cinematic hero: photographic founder scenes cross-fading with a
 * slow drift, atmospheric haze, and a glass prompt in the lower third.
 */
export function CinematicHero() {
  const scenes = useMemo(() => shuffleScenesForVisit(founderScenes), []);
  const [paused, setPaused] = useState(false);
  const phrases = useMemo(() => scenes.map((scene) => scene.phrase), [scenes]);
  const { typed, index } = useSceneCycle(phrases, !paused);
  const takeOver = useCallback(() => setPaused(true), []);

  return (
    <section className="hero-cinematic flex min-h-[88vh] flex-col justify-end overflow-hidden md:min-h-screen">
      <div className="absolute inset-0 -z-10">
        {scenes.map((scene, sceneIndex) => (
          <img
            key={scene.id}
            src={scene.image}
            alt={sceneIndex === index ? scene.alt : ""}
            aria-hidden={sceneIndex === index ? undefined : true}
            data-active={sceneIndex === index}
            width={1536}
            height={1024}
            loading={sceneIndex === 0 ? "eager" : "lazy"}
            decoding="async"
            className="hero-scene"
          />
        ))}
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
      </div>

      <div className="mx-auto w-full max-w-5xl -translate-y-[10%] px-6 pb-16 pt-32 text-center md:pb-24">
        <p className="hero-kicker text-[11px] font-medium">
          Atlanta · IGNITE Center at Greater Atlanta Christian School
        </p>
        <h1 className="mx-auto mt-7 max-w-[940px] leading-[1.06]">
          What would you like to start?
        </h1>


        <div className="mt-10">
          <IdeaPrompt ghostText={typed} paused={paused} onTakeOver={takeOver} />
        </div>


        <p className="hero-nowbuilding mt-6 text-[11px] font-medium">
          Now building:{" "}
          <span className="hero-accent">{scenes[index]?.label}</span>
        </p>
      </div>

    </section>
  );
}
