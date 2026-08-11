import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { ENGAGE_COPY, type EngagementRequestInput } from "@/lib/ops-engagement";

const PHONE = "929-234-7355";

const Schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  email: z.string().trim().email("Please use a valid email.").max(255),
  phone: z.string().trim().max(32).optional(),
  startPref: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/** Booking intake for the retainer — the only form on the engagement page. */
export function EngageIntakeDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: EngagementRequestInput) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", startPref: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(parsed.data);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that just now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {sent ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <CheckCircle2 className="h-7 w-7 text-primary" />
            <DialogTitle className="font-serif text-xl">Request received</DialogTitle>
            <DialogDescription>
              Adam's team will reach out within one business day to set the kickoff call — or call {PHONE} now.
            </DialogDescription>
            <div className="flex w-full flex-wrap gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:+1${PHONE.replace(/\D/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> Call {PHONE}
                </a>
              </Button>
              <Button className="flex-1" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{ENGAGE_COPY.primaryCta}</DialogTitle>
              <DialogDescription>
                Forty-five minutes. We walk your runway and agree the first thirty days. No payment today.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="eng-name">Your name</Label>
                <Input id="eng-name" value={form.name} maxLength={100}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eng-email">Email</Label>
                <Input id="eng-email" type="email" value={form.email} maxLength={255}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eng-phone">Phone (optional)</Label>
                <Input id="eng-phone" type="tel" value={form.phone} maxLength={32}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eng-start">When you want to start</Label>
                <Input id="eng-start" placeholder="This week, next month…" value={form.startPref} maxLength={120}
                  onChange={(e) => setForm({ ...form, startPref: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eng-notes">Anything we should know first?</Label>
              <Textarea id="eng-notes" rows={3} maxLength={2000} value={form.notes}
                placeholder="A date you're working toward, a step that's blocking you…"
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy} className="h-11 flex-1">
                {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Send the request
              </Button>
              <Button asChild variant="outline" className="h-11">
                <a href={`tel:+1${PHONE.replace(/\D/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> {PHONE}
                </a>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
