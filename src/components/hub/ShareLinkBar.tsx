import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Globe, Loader2, Settings2 } from "lucide-react";
import { createVentureShare, getVentureShare, shareUrl } from "@/lib/venture-share.functions";
import { ShareVentureDialog } from "@/components/hub/ShareVentureDialog";

/**
 * Always-visible share strip at the top of the venture hub. One click copies
 * the public showcase link; the gear opens the full settings dialog.
 */
export function ShareLinkBar({ snapshotId }: { snapshotId: string }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shareQ = useQuery({
    queryKey: ["venture-share-owner", snapshotId],
    queryFn: () => getVentureShare(snapshotId),
  });
  const share = shareQ.data;
  const url = share ? shareUrl(share.token) : "";

  const create = useMutation({
    mutationFn: async () => {
      const s = await createVentureShare(snapshotId);
      await navigator.clipboard.writeText(shareUrl(s.token)).catch(() => {});
      return s;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venture-share-owner", snapshotId] });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Share link created and copied");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create the link"),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
      <Globe className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">Share your whole venture</p>
        <p className="truncate text-xs text-muted-foreground">
          {share
            ? url
            : "One public link to every asset — brand, strategy, creative and your 14-day sprint."}
        </p>
      </div>

      {shareQ.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : share ? (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={copy}>
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Preview
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Share settings"
            onClick={() => setDialogOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Create share link
        </Button>
      )}

      <ShareVentureDialog
        snapshotId={snapshotId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hideTrigger
      />
    </div>
  );
}
