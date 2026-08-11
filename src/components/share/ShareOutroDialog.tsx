import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { requestConsultation } from "@/lib/venture-share.functions";
import { Loader2, Phone, CheckCircle2 } from "lucide-react";
import outroImage from "@/assets/share-outro-team.jpg";

const PHONE = "929-234-7355";

const FormSchema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  email: z.string().trim().email("Please use a valid email.").max(255),
  phone: z.string().trim().max(32),
  message: z.string().trim().max(1000),
});

/** The closing invitation: review, build — or retain Adam's team. */
export function ShareOutroDialog({
  open,
  onOpenChange,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
}) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestConsultation({ token, ...parsed.data });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that just now.");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
      <div className="relative min-h-[180px] overflow-hidden md:min-h-full">
        <img
          src={outroImage}
          alt="A founding team at work with Adam Anderson"
          loading="lazy"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent md:bg-gradient-to-r md:from-background/95 md:via-background/60 md:to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-6 md:justify-center md:p-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">The next step</p>
          <h2 className="mt-2 font-serif text-[26px] leading-tight text-foreground md:text-[32px]">
            Your foundation is drafted. Now build it.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Review every section, polish the creative treatments, and begin constructing and
            operationalizing your startup — a hard look at your internal resources and your
            go-to-market actions.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Or retain Adam and his team as your backfield in motion.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-4 border-t border-border/60 p-6 md:border-l md:border-t-0 md:p-8">
        {sent ? (
          <div className="flex flex-col items-start gap-3">
            <CheckCircle2 className="h-7 w-7 text-primary" />
            <h3 className="font-serif text-xl text-foreground">Request sent</h3>
            <p className="text-sm text-muted-foreground">
              Adam will be in touch shortly — or call {PHONE} now.
            </p>
            <div className="flex w-full flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:+1${PHONE.replace(/\D/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> Call {PHONE}
                </a>
              </Button>
              <Button className="flex-1" onClick={() => onOpenChange(false)}>
                Keep reviewing
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <h3 className="font-serif text-xl text-foreground">Request a consultation</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Operational consultation with Adam Anderson · {PHONE}
              </p>
            </div>
            <Input
              placeholder="Your name"
              value={form.name}
              maxLength={100}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              maxLength={255}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={form.phone}
              maxLength={32}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Textarea
              placeholder="What do you need help with?"
              rows={3}
              value={form.message}
              maxLength={1000}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-11">
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Request consultation
            </Button>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:+1${PHONE.replace(/\D/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> {PHONE}
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Keep reviewing
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="theme-dark-scope max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-background p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetTitle className="sr-only">Your next step</SheetTitle>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[880px] overflow-hidden p-0">
        <DialogTitle className="sr-only">Your next step</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}
