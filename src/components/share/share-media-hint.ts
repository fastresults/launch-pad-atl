import type { ShareItem } from "@/lib/venture-share.functions";

/**
 * Quiet visual cue for the contents list: tells a visitor at a glance which
 * rows open with pictures (logo sets, ad creatives, covers) versus plain text.
 */
export type MediaHint =
  | { kind: "images"; count: number; label: string }
  | { kind: "image"; count: 1; label: string }
  | { kind: "palette"; count: number; label: string; colors: string[] }
  | null;

export function mediaHintForItem(item: ShareItem): MediaHint {
  const board = item.brandBoard;
  if (board?.swatches?.length) {
    const colors = board.swatches
      .map((s) => s.hex)
      .filter(Boolean)
      .slice(0, 3);
    if (colors.length) {
      return { kind: "palette", count: colors.length, label: "Brand palette", colors };
    }
  }

  const gallery = item.images?.length ?? 0;
  if (gallery > 1) return { kind: "images", count: gallery, label: `${gallery} images` };
  if (gallery === 1) return { kind: "image", count: 1, label: "1 image" };
  if (item.heroImageUrl) return { kind: "image", count: 1, label: "1 image" };
  return null;
}

/** True when any child row in a category carries visuals. */
export function sectionHasMedia(items: ShareItem[]): boolean {
  return items.some((i) => mediaHintForItem(i) !== null);
}
