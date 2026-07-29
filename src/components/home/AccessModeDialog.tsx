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
    title: "Come to Atlanta",
    format: "In-person · just 20 seats",
    promise:
      "Spend one focused morning in the room with Adam. We write the four foundations together — brand, priced offer, page copy, website PRD, outreach copy, operations — and you walk out holding the foundation in writing.",
    price: `${WORKSHOP_PRICE_LABEL} — yours to keep`,
    cta: "Reserve a seat",
    to: "/register",
  },
  {
    id: "webinar",
    icon: <Video className="size-5" />,
    title: "Join us on Zoom",
    format: "Live from anywhere · small group",
    promise:
      "Same morning, same Adam, same four foundations — just over video. Same brand, same priced offer, same page copy, website PRD, and outreach copy written with you. Perfect if Atlanta's a hike or you'd rather do it from your kitchen table.",
    price: "Lower price · next date opening soon",
    cta: "Get on the list",
    to: "/webinar",
  },
  {
    id: "one_on_one",
    icon: <Wand2 className="size-5" />,
    title: "Have us build it for you",
    format: "Adam + team · done in 14 days",
    promise:
      "You've got the idea and the budget — you want the implementation handled. We'll ship the brand, site, social, and systems from the foundation, then hand you a startup ready to take money.",
    price: "$4,799 · everything included",
    cta: "See what's included",
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
          <DialogTitle className="font-serif text-3xl">Three ways to do this with us.</DialogTitle>
          <DialogDescription>
            Same real foundation. Same target of your first customer within two weeks. Pick the one that fits your life — come to Atlanta, hop on Zoom, or let us build it for you.
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
              className={`group relative flex flex-col rounded-sm border p-5 text-left transition hover:border-[#8B7355] ${
                m.featured
                  ? "border-[#8B7355] bg-[#F0EBE3]"
                  : "border-[#E4D9C4] bg-[#F5F0E5]"
              }`}
            >
              {m.featured && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm border border-[#C9B99A] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#3D3025]">
                  <Sparkles className="size-3" /> Done for you
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
          Want just you and Adam?{" "}
          <Link to="/private-tuesday" onClick={() => onOpenChange(false)} className="underline hover:text-foreground">
            Book a private Tuesday at IGNITE — $397
          </Link>
          .
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
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
