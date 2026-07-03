import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Video, Wand2, ArrowRight, MapPin, Clock, Sparkles } from "lucide-react";
import { WORKSHOP_PRICE_LABEL } from "@/lib/framework-deliverables";

type Mode = {
  id: "workshop" | "webinar" | "one_on_one";
  icon: React.ReactNode;
  title: string;
  format: string;
  promise: string;
  price: string;
  cta: string;
  to: string;
  featured?: boolean;
};

const MODES: Mode[] = [
  {
    id: "workshop",
    icon: <Users className="size-5" />,
    title: "In-person workshop",
    format: "Norcross, GA · 20 seats",
    promise:
      "One morning in the room with Adam. You leave with your 90-day plan and the assets to run it.",
    price: `${WORKSHOP_PRICE_LABEL} — yours to keep`,
    cta: "Reserve a seat",
    to: "/register",
  },
  {
    id: "webinar",
    icon: <Video className="size-5" />,
    title: "Live webinar",
    format: "Remote · small cohort",
    promise:
      "Same guided build, on video. Same plan, same assets — done live from wherever you are.",
    price: "Lower price · next cohort forming",
    cta: "Join the next webinar",
    to: "/webinar",
  },
  {
    id: "one_on_one",
    icon: <Wand2 className="size-5" />,
    title: "Done-for-you with Adam",
    format: "Adam + creative team · full build",
    promise:
      "Skip the build. Adam and his team set up your startup end-to-end — brand, website, social channels, and systems — while you stay founder.",
    price: "$1,997 · everything included",
    cta: "Have Adam build it",
    to: "/one-on-one",
    featured: true,
  },
];

function trackMode(id: Mode["id"]) {
  try {
    // Lightweight analytics hook — swap for real provider later.
    (window as any).dataLayer?.push?.({ event: "mode_selected", mode: id });
  } catch {
    /* noop */
  }
}

export function AccessModeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Three ways to work with Adam</DialogTitle>
          <DialogDescription>
            Same framework, three formats. Pick the one that fits how you want to build.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {MODES.map((m) => (
            <Link
              key={m.id}
              to={m.to}
              onClick={() => {
                trackMode(m.id);
                onOpenChange(false);
              }}
              className={`group relative flex flex-col rounded-2xl border p-5 text-left transition hover:border-primary/60 hover:bg-primary/5 ${
                m.featured
                  ? "border-primary/40 bg-primary/5"
                  : "border-white/10 bg-card"
              }`}
            >
              {m.featured && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
                  <Sparkles className="size-3" /> White-glove
                </span>
              )}
              <div className="flex items-center gap-2 text-primary">
                {m.icon}
                <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {m.id === "workshop" ? (
                  <MapPin className="size-3" />
                ) : m.id === "webinar" ? (
                  <Clock className="size-3" />
                ) : (
                  <Wand2 className="size-3" />
                )}
                {m.format}
              </p>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{m.promise}</p>
              <p className="mt-4 text-sm font-medium text-foreground">{m.price}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {m.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Not sure which fits?{" "}
          <Link to="/contact" onClick={() => onOpenChange(false)} className="underline hover:text-foreground">
            Ask Adam
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
