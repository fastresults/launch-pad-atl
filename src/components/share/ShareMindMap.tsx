import { RadialMindMap } from "@/components/brain/RadialMindMap";
import { shareToMindMap } from "@/lib/mind-map-model";
import type { SharePayload } from "@/lib/venture-share.functions";
import { useMemo } from "react";

export function ShareMindMap({
  payload,
  onOpenItem,
}: {
  payload: SharePayload;
  onOpenItem: (key: string) => void;
}) {
  const model = useMemo(() => shareToMindMap(payload), [payload]);
  return (
    <RadialMindMap
      model={model}
      onOpenItem={onOpenItem}
      emptyMessage="There are no shared assets to map yet."
      hint="Drag to explore · select an orb to open its asset"
    />
  );
}

export default ShareMindMap;
