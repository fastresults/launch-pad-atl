import { useEffect, useState } from "react";
import { listPublishedHeroImages } from "@/lib/workshop-hero-images.functions";
import type { WorkshopScene } from "@/lib/workshop-scenes";

/**
 * Published overrides from Super Admin, layered on top of the bundled set.
 * The bundled images render instantly; an override swaps in once it resolves,
 * so a slow or empty backend never delays or breaks the hero.
 */
export function useWorkshopSceneOverrides(slug: string | null | undefined) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) {
      setOverrides({});
      return;
    }
    let cancelled = false;
    listPublishedHeroImages(slug)
      .then((map) => {
        if (!cancelled) setOverrides(map);
      })
      .catch(() => {
        if (!cancelled) setOverrides({});
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return overrides;
}

/** Replaces the image of any scene that has a published override. */
export function applySceneOverrides(
  scenes: WorkshopScene[],
  overrides: Record<string, string>,
): WorkshopScene[] {
  if (!Object.keys(overrides).length) return scenes;
  return scenes.map((scene) =>
    overrides[scene.id] ? { ...scene, image: overrides[scene.id]! } : scene,
  );
}
