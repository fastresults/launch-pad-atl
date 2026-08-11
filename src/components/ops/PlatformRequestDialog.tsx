import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PLATFORM_COPY, PLATFORM_NEXT_STEPS, PLATFORM_TYPES } from "@/lib/ops-platform";

export interface PlatformRequestInput {
  description: string;
  audience: string;
  deadline: string;
  contact: string;
}

/**
 * Short intake for a platform build. Enough for a real build call, not so much
 * that it reads like a scoping form — the quote happens on the call.
 */
export function PlatformRequestDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: PlatformRequestInput) => Promise<void>;
}) {
  const [kind, setKind] = useState<string>("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(() => { setSent(false); setError(""); }, 200);
  };

  const submit = async () => {
    if (description.trim().length < 5) { setError("Tell us in a sentence what the platform does."); return; }
    setBusy(true); setError("");
    try {
      await onSubmit({
        description: kind ? `[${kind}] ${description.trim()}` : description.trim(),
        audience: audience.trim(),
        deadline: deadline.trim(),
        contact: contact.trim(),
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        {sent ? (
          <div className="py-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Request sent
              </DialogTitle>
              <DialogDescription>{PLATFORM_COPY.requested}</DialogDescription>
            </DialogHeader>
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              {PLATFORM_NEXT_STEPS.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="tabular-nums text-primary">{i + 1}.</span>{s}
                </li>
              ))}
            </ol>
            <Button className="mt-5 w-full" onClick={() => close(false)}>Back to the runway</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{PLATFORM_COPY.cta}</DialogTitle>
              <DialogDescription>{PLATFORM_COPY.price}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Closest to what you need</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORM_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setKind(kind === t ? "" : t)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        kind === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">What does the platform do?</p>
                <Textarea
                  rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="In a sentence or two — who uses it and what they do there."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Who is it for?</p>
                  <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Buyers, providers, members…" />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Any date driving this?</p>
                  <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Best way to reach you</p>
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone" />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button className="w-full" disabled={busy} onClick={() => void submit()}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Send it <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                No commitment — the call is where we scope it and quote it.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PlatformRequestDialog;
