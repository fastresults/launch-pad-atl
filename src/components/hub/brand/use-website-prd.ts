// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateDocument, listSnapshotDocuments } from "@/lib/foundersHub.functions";

/**
 * One shared path for the Website PRD.
 *
 * The PRD is deliberately excluded from bulk generation: it is the most
 * brand-dependent artifact we produce, so it is only built once the founder
 * has locked their brand, and only when they ask for it. The Brand Studio
 * panel, the deliverable card and the wizard all call this hook, so they share
 * a single mutation, a single gate and a single in-flight flag.
 */
export function useWebsitePrd(
  snapshotId: string,
  brandLockedAt?: string | null,
  brandLocked = true,
) {
  const qc = useQueryClient();

  const prdQ = useQuery({
    queryKey: ["websitePrd", snapshotId],
    queryFn: async () => {
      const docs = await listSnapshotDocuments({ data: { snapshotId } });
      return docs.find((d: any) => d.document_type === "website_prd") ?? null;
    },
    enabled: Boolean(snapshotId),
    // The build answers 202 and finishes in the background, so poll while it runs.
    refetchInterval: (q) => (q.state.data?.status === "generating" ? 6000 : false),
  });

  const prd = prdQ.data ?? null;
  const building = prd?.status === "generating";

  const regenerate = useMutation({
    mutationKey: ["websitePrdRegenerate", snapshotId],
    mutationFn: async (rewriteFeedback?: string) => {
      if (!brandLocked) throw new Error("brand_lock_required");
      await generateDocument({
        data: { snapshotId, documentType: "website_prd", ...(rewriteFeedback ? { rewriteFeedback } : {}) },
      });
      await prdQ.refetch();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub"] });
      qc.invalidateQueries({ queryKey: ["websitePrd", snapshotId] });
      toast.success("Building your website brief — it keeps going if you leave this page");
    },
    onError: (e: any) => {
      const msg = e?.message ?? "";
      toast.error(
        /brand_lock_required/i.test(msg)
          ? "Lock your brand first — the website brief is built from your final marks, palette and type."
          : msg || "Could not build the website brief",
      );
    },
  });

  // The date the award-grade PRD engine (image craft + copy craft contracts,
  // mark-derived art direction) shipped. Anything written before it is a
  // previous-generation document and should be rebuilt.
  const PRD_ENGINE_EPOCH = new Date("2026-01-01T00:00:00Z").getTime();

  // Stale when the brand was locked meaningfully after the PRD was written,
  // or when the PRD predates the current generation engine.
  const stale = Boolean(
    prd?.updated_at &&
      ((brandLockedAt &&
        new Date(brandLockedAt).getTime() - new Date(prd.updated_at).getTime() > 60_000) ||
        new Date(prd.updated_at).getTime() < PRD_ENGINE_EPOCH),
  );

  return {
    prd,
    exists: Boolean(prd?.content),
    stale,
    locked: brandLocked,
    blockedReason: brandLocked
      ? null
      : "Unlocks once your brand is locked — it's built from your final marks, palette and type.",
    building,
    loading: prdQ.isLoading,
    running: regenerate.isPending || building,
    regenerate,
  };
}
