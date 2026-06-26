// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, ArrowRight, ExternalLink } from "lucide-react";

async function listMyVentureDocuments() {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user!.id;

  const { data: snaps } = await supabase
    .from("venture_snapshots")
    .select("id, company_name, concept_summary, business_concept, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const snapIds = (snaps ?? []).map((s) => s.id);
  let docs: any[] = [];
  if (snapIds.length) {
    const { data } = await supabase
      .from("venture_documents")
      .select(
        "id, snapshot_id, document_type, status, content, word_count, deep_assessment_status, hero_image_path, deep_assessment, deep_assessment_quality_score, deep_assessment_generated_at, updated_at",
      )
      .in("snapshot_id", snapIds)
      .order("updated_at", { ascending: false });
    docs = data ?? [];
  }

  const { data: types } = await supabase
    .from("venture_document_types")
    .select("type, name, category");
  const typeMap = new Map<string, { name: string; category: string }>();
  for (const t of types ?? []) typeMap.set(t.type, { name: t.name, category: t.category });

  return { snapshots: snaps ?? [], docs, typeMap };
}

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  generating: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  pending: "bg-muted text-muted-foreground border-white/10",
};

export default function DeliverablesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my", "venture-deliverables"],
    queryFn: listMyVentureDocuments,
  });

  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "ready" | "draft">("all");
  const [snapFilter, setSnapFilter] = useState<string>("all");

  const snapshots = data?.snapshots ?? [];
  const allDocs = data?.docs ?? [];
  const typeMap = data?.typeMap ?? new Map();

  const filteredDocs = useMemo(() => {
    return allDocs.filter((d) => {
      if (snapFilter !== "all" && d.snapshot_id !== snapFilter) return false;
      if (filter === "ready" && d.status !== "complete") return false;
      if (filter === "draft" && d.status === "complete") return false;
      return true;
    });
  }, [allDocs, filter, snapFilter]);

  const docsBySnap = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const d of filteredDocs) {
      const arr = m.get(d.snapshot_id) ?? [];
      arr.push(d);
      m.set(d.snapshot_id, arr);
    }
    return m;
  }, [filteredDocs]);

  const readyCount = allDocs.filter((d) => d.status === "complete").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your deliverables</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allDocs.length === 0
              ? "Documents you generate in the Hub show up here."
              : `${readyCount} ready of ${allDocs.length} ${allDocs.length === 1 ? "document" : "documents"} across ${snapshots.length} ${snapshots.length === 1 ? "venture" : "ventures"}.`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/hub">
            Open the Hub <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {allDocs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["all", "ready", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "ready" ? "Ready" : "In progress"}
            </button>
          ))}
          {snapshots.length > 1 && (
            <select
              value={snapFilter}
              onChange={(e) => setSnapFilter(e.target.value)}
              className="rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-muted-foreground"
            >
              <option value="all">All ventures</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name ?? "Untitled venture"}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!isLoading && allDocs.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-card p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-medium">No deliverables yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to the Hub, lock a concept, and generate your first founder-ready document.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard/hub">
              Start a venture <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-10">
        {snapshots.map((s) => {
          const docs = docsBySnap.get(s.id) ?? [];
          if (docs.length === 0) return null;
          return (
            <section key={s.id} className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {s.company_name ?? "Untitled venture"}
                  </h2>
                  {(s.concept_summary || s.business_concept) && (
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">
                      {s.concept_summary ?? s.business_concept}
                    </p>
                  )}
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/dashboard/hub/${s.id}`}>
                    Open venture <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((d) => {
                  const meta = typeMap.get(d.document_type);
                  const label = meta?.name ?? d.document_type;
                  const category = meta?.category;
                  const statusClass = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending;
                  const isReady = d.status === "complete";
                  return (
                    <article
                      key={d.id}
                      className="flex flex-col rounded-xl border border-white/10 bg-card p-4 transition hover:border-white/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {category && (
                          <Badge variant="outline" className="text-[10px]">
                            {category}
                          </Badge>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass}`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-sm font-medium">{label}</h3>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {d.word_count ? `${d.word_count.toLocaleString()} words` : "—"}
                        {d.updated_at
                          ? ` · Updated ${new Date(d.updated_at).toLocaleDateString()}`
                          : ""}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          disabled={!isReady || !d.content}
                          onClick={() => setViewerDoc(d)}
                        >
                          Open
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/dashboard/hub/${d.snapshot_id}`}>Hub</Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <DocumentViewer
        doc={viewerDoc}
        open={viewerDoc !== null}
        onOpenChange={(o) => !o && setViewerDoc(null)}
      />
    </div>
  );
}
