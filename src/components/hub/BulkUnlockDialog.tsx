import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { verifyBulkUnlock } from "@/lib/foundersHub.functions";
import { toast } from "sonner";

export function BulkUnlockDialog({
  open,
  onOpenChange,
  snapshotId,
  totalDocs,
  onUnlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshotId: string;
  totalDocs: number;
  onUnlocked: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const ok = await verifyBulkUnlock({ snapshotId, code: code.trim() });
      if (!ok) {
        setErr("That code didn't match. Contact your facilitator.");
        return;
      }
      toast.success("Unlocked — starting bulk generation");
      setCode("");
      onOpenChange(false);
      onUnlocked();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't verify code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Unlock "Generate all"
          </DialogTitle>
          <DialogDescription>
            This writes all {totalDocs} assets in one go and uses significant credits. Enter your unlock code
            to continue. The guided category-by-category flow does not require a code.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            placeholder="Unlock code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setErr(null); }}
            disabled={busy}
          />
          {err && <p className="text-xs text-status-error">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy || !code.trim()}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Unlock & generate all
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
