import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitInquiry } from "@/lib/inquiries.functions";
import { REMOTE_SETUP } from "@/lib/workshop-products";

const Schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  email: z.string().trim().email("Please use a valid email.").max(255),
  phone: z.string().trim().min(1, "A number helps us reach you.").max(32),
  location: z.string().trim().max(120).optional(),
  times: z.string().trim().max(500).optional(),
  goal: z.string().trim().max(500).optional(),
});

const EMPTY = { name: "", email: "", phone: "", location: "", times: "", goal: "", website: "" };

/** Books the 20-minute discovery call for the remote, done-for-you setup. */
export function RemoteSetupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof typeof EMPTY>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = Schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Please check the form.");
      const d = parsed.data;
      await submitInquiry({
        name: d.name,
        email: d.email,
        phone: d.phone,
        subject: `One-on-one remote setup (${REMOTE_SETUP.price}) — discovery call request`,
        message: [
          `Where they are: ${d.location || "—"}`,
          `Best times for a 20-minute call: ${d.times || "—"}`,
          `What they want to start: ${d.goal || "—"}`,
        ].join("\n"),
        website: form.website,
      });
    },
    onSuccess: () => {
      setError(null);
      setSent(true);
    },
    onError: (e: Error) => setError(e.message || "We couldn't send that just now."),
  });

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v && sent) {
      setSent(false);
      setForm(EMPTY);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {sent ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" />
            <DialogTitle className="text-xl">You're booked in.</DialogTitle>
            <DialogDescription>
              We'll confirm your call time by email within one business day — then it's discovery,
              build, and your walkthrough within two business days after that.
            </DialogDescription>
            <Button className="mt-2 w-full" onClick={() => close(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle className="text-xl">Schedule your setup</DialogTitle>
              <DialogDescription>
                Twenty minutes to start. Tell us when works and we'll confirm your discovery call.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rs-name">Your name</Label>
                <Input id="rs-name" maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-email">Email</Label>
                <Input id="rs-email" type="email" maxLength={255} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-phone">Phone</Label>
                <Input id="rs-phone" type="tel" maxLength={32} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-location">Where you're based</Label>
                <Input id="rs-location" maxLength={120} placeholder="Denver, MT" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rs-times">Best days and times for a 20-minute call</Label>
              <Input id="rs-times" maxLength={500} placeholder="Weekday mornings, or Thursday after 4pm" value={form.times} onChange={(e) => set("times", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rs-goal">What do you want to start?</Label>
              <Textarea id="rs-goal" rows={3} maxLength={500} placeholder="One line is plenty." value={form.goal} onChange={(e) => set("goal", e.target.value)} />
            </div>

            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button type="submit" disabled={mutation.isPending} className="h-11 w-full">
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              {REMOTE_SETUP.cta}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{REMOTE_SETUP.fineprint}</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
