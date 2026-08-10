// @ts-nocheck
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateBrandAsset } from "@/lib/foundersHub.functions";

export const MOODBOARD_TILE_COUNT = 9;
const BATCH = 3;

/**
 * One shared mood board regeneration path.
 *
 * Nine image calls cannot fit inside a single edge request, so the run is
 * driven from the client in three batches of three. Nothing is written to the
 * brand kit until the tiles are back — a mid-run failure leaves the founder's
 * previous board untouched.
 */
export function useMoodboard(snapshotId: string, opts?: { onCommitted?: (tiles: any[]) => void }) {
  const qc = useQueryClient();
  const [done, setDone] = useState(0);

  const regenerate = useMutation({
    mutationKey: ["moodboardRegenerate", snapshotId],
    mutationFn: async () => {
      setDone(0);
      const tiles: any[] = [];

      for (let offset = 0; offset < MOODBOARD_TILE_COUNT; offset += BATCH) {
        const run = async () =>
          generateBrandAsset({
            data: { snapshotId, kind: "moodboard", count: BATCH, angleOffset: offset, defer: true },
          });

        let out: any;
        try {
          out = await run();
        } catch (e) {
          // One retry per batch before we give up on those tiles.
          out = await run();
        }
        const fresh = (out?.assets ?? []).filter((a: any) => a?.ok);
        tiles.push(...fresh.map((a: any) => ({ url: a.url, path: a.path })));
        setDone(tiles.length);
      }

      if (tiles.length < 6) {
        throw new Error(`Only ${tiles.length} of ${MOODBOARD_TILE_COUNT} tiles came back — your existing mood board is unchanged. Try again.`);
      }

      const res = await generateBrandAsset({
        data: { snapshotId, kind: "moodboard_commit", tiles, replace: true },
      });
      return (res?.moodboard ?? tiles) as any[];
    },
    onSuccess: (board) => {
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      qc.invalidateQueries({ queryKey: ["hub"] });
      opts?.onCommitted?.(board);
      toast.success(
        board.length === MOODBOARD_TILE_COUNT
          ? "Mood board rebuilt — 9 fresh tiles"
          : `Mood board rebuilt with ${board.length} tiles`,
      );
    },
    onError: (e: any) => toast.error(e?.message || "Mood board regeneration failed"),
    onSettled: () => setDone(0),
  });

  return {
    regenerate,
    running: regenerate.isPending,
    done,
    total: MOODBOARD_TILE_COUNT,
    label: regenerate.isPending
      ? `Building tile ${Math.min(done + 1, MOODBOARD_TILE_COUNT)} of ${MOODBOARD_TILE_COUNT}…`
      : null,
  };
}
