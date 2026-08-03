import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const [cueHidden, setCueHidden] = useState(false);

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
            className="sl-hero__scene"
            style={{ animationDelay: `-${(sceneIndex * 5) % 24}s` }}
          />
        ))}
        <div className="sl-hero__scrim" />
        <div className="sl-hero__grain" />
      </div>

      <div className="sl-hero__stack">
        <p className="sl-hero__kicker">
          Atlanta · IGNITE Center at Greater Atlanta Christian School
        </p>
        <h1 className="sl-hero__title">What would you like to start?</h1>
        <div className="sl-hero__prompt">
          <IdeaPrompt ghostText={typed} paused={paused} onTakeOver={takeOver} />
        </div>
        <p className="sl-hero__status">
          Now building:{" "}
          <span>{scenes[index]?.label}</span>
        </p>
      </div>
    </section>
  );
}
