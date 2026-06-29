import { Sparkles, ArrowRight, Compass, Target, FileText, Pencil } from "lucide-react";

type Props = {
  onGenerateFirst: () => void;
  onSeeDeliverables: () => void;
  onEditBrief: () => void;
  hasExistingVentures?: boolean;
};

export function BriefCompleteScreen({ onGenerateFirst, onSeeDeliverables, onEditBrief, hasExistingVentures = false }: Props) {
  const ctaLabel = hasExistingVentures ? "Open your Startup Hub" : "Generate your first deliverable";
  const headline = hasExistingVentures ? "Pick up where you left off." : "Generate your first deliverable.";
  const subcopy = hasExistingVentures
    ? "Your brief just got sharper — jump back into your Startup Hub to refresh existing deliverables or start a new venture."
    : "We'll open your Startup Snapshot with your brief already filled in — review it, add your city and state, then we generate.";
  return (
    <div className="mt-10 space-y-10">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Your founder brief is locked in
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          You've given the AI the full picture.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          From here on, every deliverable we build is grounded in your story, your market, and your
          edge — not a generic framework.
        </p>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Here's what your brief just unlocked
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <UnlockCard
            icon={<Compass className="h-4 w-4" />}
            title="Sharper positioning"
            body="Your story, your edge, and the 'why you' framing — ready to thread through every doc."
          />
          <UnlockCard
            icon={<Target className="h-4 w-4" />}
            title="A market read tuned to you"
            body="Industry, customer type, geography, and channels — so we don't speak in averages."
          />
          <UnlockCard
            icon={<FileText className="h-4 w-4" />}
            title="Deliverables that sound like you"
            body="Every one of the 34 deliverables is generated from your own words and numbers."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-6 md:p-8">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your next step
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
          Generate your first deliverable.
        </h2>
        <p className="mt-2 text-muted-foreground max-w-xl">
          We'll open your Startup Snapshot with your brief already filled in — review it, add your
          city and state, then we generate.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={onGenerateFirst}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
          >
            Generate your first deliverable <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onSeeDeliverables}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium hover:bg-muted/30"
          >
            See all 34 deliverables
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-6">
        <p className="text-sm text-muted-foreground">
          You can come back and refine any answer anytime — your brief stays live.
        </p>
        <button
          onClick={onEditBrief}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> Review or edit my brief
        </button>
      </div>
    </div>
  );
}

function UnlockCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">{icon}</span> {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
