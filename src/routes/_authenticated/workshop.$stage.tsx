import { useParams, Navigate } from "react-router-dom";
import { SlideDeck } from "@/components/workshop-slides/SlideDeck";
import { getDeck } from "@/components/workshop-slides/registry";

export default function WorkshopStagePage() {
  const { stage } = useParams<{ stage: string }>();
  const deck = stage ? getDeck(stage) : undefined;

  if (!deck) return <Navigate to="/dashboard/day" replace />;
  if (!deck.available) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Stage {deck.stageNumber}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{deck.title} deck — coming soon</h1>
          <p className="mt-3 text-muted-foreground">
            We're shipping these one stage at a time. Foundation is live now.
          </p>
          <a href="/dashboard/day" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            ← Back to workshop morning
          </a>
        </div>
      </div>
    );
  }

  return <SlideDeck stageTitle={deck.title} slides={deck.slides} exitTo="/dashboard/day" />;
}
