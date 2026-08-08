import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, ExternalLink, Link2, Loader2, Share2 } from "lucide-react";
import {
  createVentureShare,
  getVentureShare,
  revokeVentureShare,
  sha256Hex,
  shareUrl,
  updateVentureShare,
} from "@/lib/venture-share.functions";

/**
 * Owner control panel for the public venture showcase link: mint, protect,
 * expire and revoke. The link itself is read-only and works signed out.
 */
export function ShareVentureDialog({
  snapshotId,
  open: openProp,
  onOpenChange,
  hideTrigger,
}: {
  snapshotId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const qc = useQueryClient();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOpenState(v));
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [chatEnabled, setChatEnabled] = useState(true);


  const shareQ = useQuery({
    queryKey: ["venture-share-owner", snapshotId],
    queryFn: () => getVentureShare(snapshotId),
    enabled: open,
  });
  const share = shareQ.data;

  useEffect(() => {
    if (!share) return;
    setUsePassword(!!share.password_hash);
    setUseExpiry(!!share.expires_at);
    setExpiry(share.expires_at ? share.expires_at.slice(0, 10) : "");
    setChatEnabled((share as any).chat_enabled !== false);
  }, [share?.id]);


  const invalidate = () => qc.invalidateQueries({ queryKey: ["venture-share-owner", snapshotId] });

  const create = useMutation({
    mutationFn: () => createVentureShare(snapshotId),
    onSuccess: () => {
      invalidate();
      toast.success("Share link created");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create the link"),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!share) return;
      const patch: any = {
        expires_at: useExpiry && expiry ? new Date(`${expiry}T23:59:59Z`).toISOString() : null,
      };
      if (!usePassword) patch.password_hash = null;
      else if (password) patch.password_hash = await sha256Hex(password);
      return updateVentureShare(share.id, patch);
    },
    onSuccess: () => {
      setPassword("");
      invalidate();
      toast.success("Link settings saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const revoke = useMutation({
    mutationFn: () => revokeVentureShare(share!.id),
    onSuccess: () => {
      invalidate();
      toast.success("Link revoked");
    },
  });

  const url = share ? shareUrl(share.token) : "";

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Share2 className="mr-1.5 h-4 w-4" />
            Share venture
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Share this venture</DialogTitle>
          <DialogDescription>
            A public, read-only showcase of every asset — brand, strategy, creative and the 14-day
            sprint. Anyone with the link can view it; nobody needs an account.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {shareQ.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !share ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <Link2 className="mx-auto mb-3 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No share link yet.</p>
              <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Create share link
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Public link
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input readOnly value={url} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={copy} aria-label="Copy link">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="outline" asChild aria-label="Open link">
                    <a href={url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {share.view_count ?? 0} view{(share.view_count ?? 0) === 1 ? "" : "s"}
                  {share.last_viewed_at
                    ? ` · last opened ${new Date(share.last_viewed_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Require a password</p>
                    <p className="text-xs text-muted-foreground">
                      Viewers must enter it before the showcase loads.
                    </p>
                  </div>
                  <Switch checked={usePassword} onCheckedChange={setUsePassword} />
                </div>
                {usePassword && (
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={share.password_hash ? "Enter a new password to change it" : "Choose a password"}
                  />
                )}

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Ask-anything chat</p>
                    <p className="text-xs text-muted-foreground">
                      Visitors can question the venture by typing or speaking.
                    </p>
                  </div>
                  <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Expire the link</p>
                    <p className="text-xs text-muted-foreground">Stops working after this date.</p>
                  </div>
                  <Switch checked={useExpiry} onCheckedChange={setUseExpiry} />
                </div>
                {useExpiry && (
                  <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                )}

                <Separator />

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Header art</p>
                    <p className="text-xs text-muted-foreground">
                      {backfill.isPending
                        ? "Generating missing header images…"
                        : "Fill in any asset that is still missing its header image."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => backfill.mutate()}
                    disabled={backfill.isPending}
                  >
                    {backfill.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="mr-1.5 h-4 w-4" />
                    )}
                    Generate missing
                  </Button>
                </div>
              </div>

            </>
          )}
        </div>

        {share && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t pt-4">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => revoke.mutate()}
              disabled={revoke.isPending}
            >
              Revoke link
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save settings
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
