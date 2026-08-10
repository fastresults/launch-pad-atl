// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateDocument, listSnapshotDocuments } from "@/lib/foundersHub.functions";

/**
 * One shared regenerate path for the Website PRD.
 *
 * The action used to live only inside the Brand Wizard's Logo Studio step, so
 * once a founder closed the wizard there was no way back to it. The Brand
 * Studio panel, the deliverable card and the wizard all call this hook now, so
 * they share a single mutation and a single in-flight flag.
 */
export function useWebsitePrd(snapshotId: string, brandLockedAt?: string | null) {
  const qc = useQueryClient();

  const prdQ = useQuery({
    queryKey: ["websitePrd", snapshotId],
    queryFn: async () => {
      const docs = await listSnapshotDocuments({ data: { snapshotId } });
      return docs.find((d: any) => d.document_type === "website_prd") ?? null;
    },
    enabled: Boolean(snapshotId),
  });

  const prd = prdQ.data ?? null;

  const regenerate = useMutation({
    mutationKey: ["websitePrdRegenerate", snapshotId],
    mutationFn: async (rewriteFeedback?: string) => {
      await generateDocument({
        data: { snapshotId, documentType: "website_prd", ...(rewriteFeedback ? { rewriteFeedback } : {}) },
      });
      await prdQ.refetch();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub"] });
      qc.invalidateQueries({ queryKey: ["websitePrd", snapshotId] });
      toast.success("Website PRD rebuilt with your locked brand");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not rebuild the Website PRD"),
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


  return { prd, exists: Boolean(prd), stale, loading: prdQ.isLoading, running: regenerate.isPending, regenerate };
}
