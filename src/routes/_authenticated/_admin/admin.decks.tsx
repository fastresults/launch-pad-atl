import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STAGE_DECKS } from "@/components/workshop-slides/registry";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Presentation, Lock, ArrowRight } from "lucide-react";

async function fetchOverrideCounts() {
  const { data, error } = await supabase
    .from("deck_slide_overrides")
    .select("deck_slug");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { deck_slug: string }[]) {
    counts[r.deck_slug] = (counts[r.deck_slug] ?? 0) + 1;
  }
  return counts;
}

export default function AdminDecksPage() {
  const { data: counts = {} } = useQuery({
    queryKey: ["deck-override-counts"],
    queryFn: fetchOverrideCounts,
    staleTime: 30_000,
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <AdminPageHeader
        title="Facilitator decks"
        description="Edit slide copy and swap or generate slide images for any workshop deck."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {STAGE_DECKS.map((d) => {
          const overrideCount = counts[d.slug] ?? 0;
          const editable = d.available;
          return (
            <div
              key={d.slug}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {d.stageNumber}
                  </div>
                  <div className="text-lg font-semibold tracking-tight">{d.title}</div>
                </div>
                <Presentation className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="text-sm text-muted-foreground">
                {editable ? `${d.slides.length} slides authored` : "Deck not yet authored"}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!editable && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" /> Coming soon
                  </Badge>
                )}
                {overrideCount > 0 && (
                  <Badge variant="secondary">
                    {overrideCount} {overrideCount === 1 ? "edit" : "edits"}
                  </Badge>
                )}
              </div>

              {editable ? (
                <Link
                  to={`/admin/decks/${d.slug}`}
                  className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Edit deck <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                  Locked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
