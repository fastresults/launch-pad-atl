import { useCallback, useMemo, useState } from "react";
import { founderScenes, shuffleScenes } from "@/lib/founder-scenes";
import { useSceneCycle } from "@/hooks/use-scene-cycle";
import { IdeaPrompt } from "@/components/home/IdeaPrompt";

/**
 * Full-viewport cinematic hero: photographic founder scenes cross-fading with a
 * slow drift, atmospheric haze, and a glass prompt in the lower third.
 */
export function CinematicHero() {
  const scenes = useMemo(() => shuffleScenes(founderScenes), []);
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

      <div className="mx-auto w-full max-w-6xl px-6 pb-14 pt-28 md:pb-20">
        <p className="hero-kicker text-[11px] font-medium">
          Atlanta · IGNITE Center at Greater Atlanta Christian School
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
          Whatever you want to start,
          <br />
          we build the foundation with you.
        </h1>
        <p className="hero-sub mt-5 max-w-xl text-base md:text-lg">
          One focused morning. Your brand, your offer, your live page, your first
          message sent — written in the room, not left as homework.
        </p>

        <div className="mt-8">
          <IdeaPrompt ghostText={typed} paused={paused} onTakeOver={takeOver} />
        </div>

        <div className="mt-8 flex items-center gap-2" aria-hidden="true">
          {scenes.map((scene, sceneIndex) => (
            <span
              key={scene.id}
              className="hero-dot"
              data-active={sceneIndex === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
