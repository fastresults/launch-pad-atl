import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { WORKSHOP_CATALOG, nextDateLabel, type CatalogWorkshop } from "@/lib/workshop-catalog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (slug: string) => void;
};

/**
 * The full catalog, one click deep from the hero. Foundation is the door; the
 * eight build layers each open on their own month and capture a waitlist email
 * until they do.
 */
export function WorkshopGatewaySheet({ open, onOpenChange, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] w-[min(56rem,94vw)] overflow-y-auto border-white/10 bg-[oklch(0.14_0.02_268)] p-0 text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Nine workshops. One morning each.
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/60">
            Start with Foundation — everything else builds on what you leave with. One new
            workshop opens each month.
          </DialogDescription>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {WORKSHOP_CATALOG.map((w) => (
            <WorkshopCard
              key={w.slug}
              workshop={w}
              onSelect={() => {
                onSelect(w.slug);
                onOpenChange(false);
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkshopCard({
  workshop,
  onSelect,
}: {
  workshop: CatalogWorkshop;
  onSelect: () => void;
}) {
  const Icon = workshop.icon;
  const date = nextDateLabel(workshop.slug);
  const isOpen = workshop.status === "open";

  return (
    <div
      data-open={isOpen || undefined}
      className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 data-[open]:border-[color:var(--sl-quote-gold)]/50"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 text-[color:var(--sl-quote-gold)]" aria-hidden="true" />
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
          {isOpen ? `Open · ${workshop.priceLabel}` : workshop.opensLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="mt-3 text-left text-base font-semibold leading-snug hover:text-[color:var(--sl-quote-gold)]"
      >
        {workshop.title}
      </button>
      <p className="mt-1 text-sm text-white/60">{workshop.oneLiner}</p>
      <ul className="mt-3 space-y-1 text-xs text-white/55">
        {workshop.walkOuts.slice(0, 2).map((d) => (
          <li key={d} className="line-clamp-2">
            · {d}
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-white/10">
        {isOpen ? (
          <>
            {date && <p className="mb-2 text-xs text-white/50">Next: {date}</p>}
            <Link
              to={workshop.href}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--sl-quote-gold)] px-4 py-2 text-sm font-medium text-black"
            >
              Reserve your seat <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <NotifyForm slug={workshop.slug} />
        )}
      </div>
    </div>
  );
}

function NotifyForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      setState("error");
      return;
    }
    setState("saving");
    const { error } = await supabase
      .from("workshop_waitlist")
      .insert({ email: email.trim().toLowerCase(), workshop_slug: slug });
    setState(error ? "error" : "done");
  };

  if (state === "done") {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-white/70">
        <Check className="size-4 text-[color:var(--sl-quote-gold)]" aria-hidden="true" />
        You're on the list.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="you@email.com"
        aria-label="Email for workshop waitlist"
        aria-invalid={state === "error" || undefined}
        className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none aria-[invalid]:border-destructive"
      />
      <button
        type="submit"
        disabled={state === "saving"}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        {state === "saving" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          "Notify me"
        )}
      </button>
    </form>
  );
}
