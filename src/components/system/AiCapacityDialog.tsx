import { useEffect, useState } from "react";
import { toast } from "sonner";
import startupLabsLogo from "@/assets/startuplabs-logo.svg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { recentNoticeAt, sendCapacityNotice, type CapacityInfo } from "@/lib/ai-capacity";

type Props = {
  open: boolean;
  info: CapacityInfo | null;
  contextLabel?: string;
  snapshotId?: string | null;
  onOpenChange: (open: boolean) => void;
};

export function AiCapacityDialog({ open, info, contextLabel, snapshotId, onOpenChange }: Props) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNote("");
      setSending(false);
      setSent(false);
      setAlreadyReported(null);
      return;
    }
    let cancelled = false;
    void recentNoticeAt().then((at) => {
      if (!cancelled) setAlreadyReported(at);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!info) return null;

  const providers = info.providers;
  const isRate = info.kind === "rate_limit";

  const handleSend = async () => {
    setSending(true);
    try {
      await sendCapacityNotice({
        contextLabel,
        snapshotId,
        code: info.code,
        providers,
        note,
      });
      setSent(true);
    } catch (e: any) {
      toast.error(e?.message || "We couldn't send that notice. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-4">
          <img
            src={startupLabsLogo}
            alt="Startup Labs"
            className="h-8 w-auto self-start"
            loading="lazy"
          />
          <DialogTitle className="text-xl">
            {isRate ? "The AI is briefly at capacity" : "We're out of AI capacity right now"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Nothing is wrong with your work — this step paused because our AI capacity ran out.
            Send us a notice and the team will top it up, usually by the next business day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(providers.length > 0 || contextLabel) && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              {providers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    At limit
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {providers.map((p) => (
                      <span
                        key={`${p.id}-${p.capability ?? ""}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium"
                      >
                        {p.label}
                        {p.capability ? (
                          <span className="text-muted-foreground">· {p.capability}</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {contextLabel && (
                <p className="text-xs text-muted-foreground">
                  Paused step: <span className="text-foreground">{contextLabel}</span>
                </p>
              )}
            </div>
          )}

          {sent ? (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              Notice sent. We'll restore capacity and you can pick up right where you left off —
              your saved work is untouched.
            </p>
          ) : (
            <>
              {alreadyReported && (
                <p className="text-xs text-muted-foreground">
                  You already sent a notice on{" "}
                  {new Date(alreadyReported).toLocaleString()} — sending another is fine if this is
                  a different step.
                </p>
              )}
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything we should know? (optional)"
                rows={3}
                maxLength={1000}
              />
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {sent ? "Close" : "Not now"}
          </Button>
          {!sent && (
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending…" : "Send notice"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
