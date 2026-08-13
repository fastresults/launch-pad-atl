import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSurfaceLogo } from "@/hooks/use-surface-logo";
import { ArrowRight, Mail, X } from "lucide-react";
import type { SharePayload } from "@/lib/venture-share.functions";

interface ShareWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  payload: SharePayload;
  /** Called when the user toggles the "Don't show again" checkbox. */
  onPersistChange?: (persist: boolean) => void;
  persist?: boolean;
}

const ADAM_PHONE = "929-234-7355";

/** First-time welcome: a personal note from Adam explaining what the client is seeing. */
export function ShareWelcomeModal({
  open,
  onOpenChange,
  token,
  payload,
  onPersistChange,
  persist = true,
}: ShareWelcomeModalProps) {
  const isMobile = useIsMobile();
  const surfaceLogo = useSurfaceLogo(payload.venture);
  const founderName = payload.venture.founderName?.trim();
  const ventureName = payload.venture.name;
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://startuplabs.online/v/${token}`;
  const mailtoBody = `Hi Adam,\n\nI’m looking at the ${ventureName} showcase: ${shareUrl}\n\n`;

  const [checked, setChecked] = useState(persist);

  useEffect(() => {
    setChecked(persist);
  }, [persist]);

  const handleCheckedChange = (value: boolean) => {
    setChecked(value);
    onPersistChange?.(value);
  };

  const handlePrimary = () => {
    onOpenChange(false);
    window.location.href = `/v/${token}/engage`;
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const body = (
    <div className="flex flex-col">
      <div className="flex items-start gap-4 border-b border-border/60 p-6 md:p-8">
        {surfaceLogo && (
          <img
            src={surfaceLogo}
            alt={ventureName}
            className="h-12 w-12 shrink-0 rounded-lg object-contain md:h-14 md:w-14"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Venture showcase · {payload.sections.reduce((n, s) => n + s.items.length, 0)} assets
          </p>
          <h2 className="mt-1 font-serif text-[22px] leading-tight text-foreground md:text-[28px]">
            {ventureName}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="hidden rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground md:block"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 p-6 md:p-8">
        <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
          <p className="text-foreground">
            {founderName ? `Hey ${founderName} —` : "Hey —"}
          </p>
          <p>
            You are looking at a complete startup foundation for{" "}
            <strong className="text-foreground">{ventureName}</strong>, built in two weeks through
            the 14-Day Pivot Method.
          </p>
          <p>
            Inside this showcase you’ll find the real assets we created together: your brand story,
            priced offer, launch page copy, website PRD, outreach assets, your 14-day sprint, and the
            operating runway that turns it into a running startup. Each one is yours to keep, use, or
            hand to a builder.
          </p>
          <p>
            The best way to read it: start with the Executive Summary, then open the Launch Timeline
            to see the cadence from idea to first revenue. If you have a question, use{" "}
            <strong className="text-foreground">Ask this venture</strong> — it knows everything in
            this kit.
          </p>
          <p>
            If you want Startup Labs to build it out, book the kickoff call below. If you’d rather run
            with it yourself, that is exactly what this is for.
          </p>
          <p className="text-foreground">— Adam</p>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button className="h-11 flex-1" onClick={handlePrimary}>
            Book the kickoff call
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button asChild variant="outline" className="h-11 flex-1">
            <a
              href={`mailto:adam@startuplabs.online?subject=${encodeURIComponent(`About ${ventureName}`)}&body=${encodeURIComponent(mailtoBody)}`}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              Reply to Adam
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <Checkbox
            id="welcome-persist"
            checked={checked}
            onCheckedChange={handleCheckedChange}
          />
          <label
            htmlFor="welcome-persist"
            className="cursor-pointer text-[13px] text-muted-foreground"
          >
            Don’t show this again
          </label>
        </div>

        <p className="text-[12px] text-muted-foreground/70">
          Questions? Call or text Adam at{" "}
          <a href={`tel:+1${ADAM_PHONE.replace(/\D/g, "")}`} className="text-primary underline">
            {ADAM_PHONE}
          </a>
          .
        </p>
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
          <SheetTitle className="sr-only">Welcome to your venture showcase</SheetTitle>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-dark-scope max-w-[640px] overflow-hidden border-border/60 bg-background p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Welcome to your venture showcase</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}
