// @ts-nocheck
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, ArrowRight, ExternalLink, Search, Send, X, Loader2 } from "lucide-react";
import { invokeEdge } from "@/lib/edge-invoke";
import { getEffectiveUserId } from "@/lib/effective-user";

async function listMyVentureDocuments() {
  const userId = await getEffectiveUserId();

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
  pending: "bg-muted text-muted-foreground border-border",
};

const SUGGESTIONS = [
  "Summarize my go-to-market plan",
  "What's our pricing logic?",
  "Top 3 risks for this venture",
  "Funding ask and use of funds",
  "Who is our ideal customer?",
  "What's in our 90-day plan?",
];

function scoreDoc(d: any, label: string, category: string, query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return { score: 0, snippet: "" };
  const terms = q.split(/\s+/).filter((t) => t.length > 1);
  const title = (label ?? "").toLowerCase();
  const cat = (category ?? "").toLowerCase();
  const body = (d.content ?? "").toLowerCase();
  let score = 0;
  let firstHit = -1;
  for (const t of terms) {
    if (title.includes(t)) score += 5;
    if (cat.includes(t)) score += 3;
    let idx = body.indexOf(t);
    while (idx !== -1) {
      score += 1;
      if (firstHit === -1) firstHit = idx;
      idx = body.indexOf(t, idx + t.length);
    }
  }
  let snippet = "";
  if (firstHit !== -1 && d.content) {
    const start = Math.max(0, firstHit - 100);
    const end = Math.min(d.content.length, firstHit + 180);
    snippet = (start > 0 ? "…" : "") + d.content.slice(start, end) + (end < d.content.length ? "…" : "");
  }
  return { score, snippet };
}

export default function DeliverablesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my", "venture-deliverables"],
    queryFn: listMyVentureDocuments,
  });

  const [viewerDoc, setViewerDoc] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "ready" | "draft">("all");
  const [snapFilter, setSnapFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [updatedFilter, setUpdatedFilter] = useState<"all" | "7d" | "30d">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "updated" | "words">("relevance");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askAnswer, setAskAnswer] = useState<{ answer: string; citations: any[]; question: string } | null>(null);

  const snapshots = data?.snapshots ?? [];
  const allDocs = data?.docs ?? [];
  const typeMap = data?.typeMap ?? new Map();

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const d of allDocs) {
      const c = typeMap.get(d.document_type)?.category;
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [allDocs, typeMap]);

  const enriched = useMemo(() => {
    return allDocs.map((d) => {
      const meta = typeMap.get(d.document_type);
      const label = meta?.name ?? d.document_type;
      const category = meta?.category ?? "";
      const { score, snippet } = scoreDoc(d, label, category, debouncedQuery);
      return { ...d, _label: label, _category: category, _score: score, _snippet: snippet };
    });
  }, [allDocs, typeMap, debouncedQuery]);

  const filteredDocs = useMemo(() => {
    const now = Date.now();
    return enriched.filter((d) => {
      if (snapFilter !== "all" && d.snapshot_id !== snapFilter) return false;
      if (filter === "ready" && d.status !== "complete") return false;
      if (filter === "draft" && d.status === "complete") return false;
      if (categoryFilter !== "all" && d._category !== categoryFilter) return false;
      if (updatedFilter !== "all" && d.updated_at) {
        const days = (now - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        if (updatedFilter === "7d" && days > 7) return false;
        if (updatedFilter === "30d" && days > 30) return false;
      }
      if (debouncedQuery && d._score === 0) return false;
      return true;
    });
  }, [enriched, filter, snapFilter, categoryFilter, updatedFilter, debouncedQuery]);

  const sortedDocs = useMemo(() => {
    const arr = [...filteredDocs];
    if (debouncedQuery && sortBy === "relevance") {
      arr.sort((a, b) => b._score - a._score);
    } else if (sortBy === "words") {
      arr.sort((a, b) => (b.word_count ?? 0) - (a.word_count ?? 0));
    } else {
      arr.sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
    }
    return arr;
  }, [filteredDocs, debouncedQuery, sortBy]);

  const docsBySnap = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const d of sortedDocs) {
      const arr = m.get(d.snapshot_id) ?? [];
      arr.push(d);
      m.set(d.snapshot_id, arr);
    }
    return m;
  }, [sortedDocs]);

  const readyCount = allDocs.filter((d) => d.status === "complete").length;

  async function runAsk(question: string) {
    if (!question.trim()) return;
    setAskLoading(true);
    setAskError(null);
    setAskAnswer(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const res = await invokeEdge("deliverables-ask", {
        body: {
          question,
          snapshot_id: snapFilter !== "all" ? snapFilter : undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.error) throw res.error;
      const payload = res.data;
      if (payload?.error) throw new Error(payload.error);
      setAskAnswer({ answer: payload.answer ?? "", citations: payload.citations ?? [], question });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("402") || msg.toLowerCase().includes("credit")) {
        setAskError("Daily AI cap reached — keyword search still works.");
      } else if (msg.includes("429")) {
        setAskError("Rate limited. Try again in a moment.");
      } else {
        setAskError(msg);
      }
    } finally {
      setAskLoading(false);
    }
  }

  function openCitation(c: any) {
    const doc = allDocs.find((d) => d.id === c.document_id);
    if (doc) setViewerDoc(doc);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your startup assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allDocs.length === 0
              ? "Assets you generate in the Hub show up here."
              : `${readyCount} ready of ${allDocs.length} ${allDocs.length === 1 ? "asset" : "assets"} across ${snapshots.length} ${snapshots.length === 1 ? "venture" : "ventures"}.`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/hub">
            Open the Hub <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {allDocs.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ask or search your startup assets</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAsk(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search snippets, or press Enter to ask AI…"
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear"
                  onClick={() => {
                    setQuery("");
                    setAskAnswer(null);
                    setAskError(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={askLoading || !query.trim()}>
              {askLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Ask AI</span>
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  runAsk(s);
                }}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {(askLoading || askAnswer || askError) && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI answer
            {askAnswer && <span className="ml-2 normal-case text-muted-foreground/70">· {askAnswer.question}</span>}
          </div>
          {askLoading && (
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          )}
          {askError && <p className="text-sm text-amber-700 dark:text-amber-300">{askError}</p>}
          {askAnswer && !askLoading && (
            <>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {askAnswer.answer}
              </div>
              {askAnswer.citations.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {askAnswer.citations.map((c) => (
                      <button
                        key={c.index}
                        onClick={() => openCitation(c)}
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-left text-xs hover:border-foreground"
                        title={c.snippet}
                      >
                        <span className="font-medium">[{c.index}]</span> {c.document_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {allDocs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "ready", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "ready" ? "Ready" : "In progress"}
            </button>
          ))}
          {categories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          {snapshots.length > 1 && (
            <select
              value={snapFilter}
              onChange={(e) => setSnapFilter(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
            >
              <option value="all">All ventures</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name ?? "Untitled venture"}
                </option>
              ))}
            </select>
          )}
          <select
            value={updatedFilter}
            onChange={(e) => setUpdatedFilter(e.target.value as any)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
          >
            <option value="all">Any time</option>
            <option value="7d">Updated · 7 days</option>
            <option value="30d">Updated · 30 days</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="updated">Sort: Recently updated</option>
            <option value="words">Sort: Word count</option>
          </select>
          {debouncedQuery && (
            <span className="ml-1 text-xs text-muted-foreground">
              {sortedDocs.length} {sortedDocs.length === 1 ? "match" : "matches"} for "{debouncedQuery}"
            </span>
          )}
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!isLoading && allDocs.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-medium">No startup assets yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to the Hub, lock a concept, and generate your first founder-ready asset.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard/hub">
              Start a venture <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && allDocs.length > 0 && sortedDocs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No matches for "{debouncedQuery}". Try Ask AI for a synthesized answer across all your docs.
          </p>
        </div>
      )}

      <div className="space-y-10">
        {snapshots.map((s) => {
          const docs = docsBySnap.get(s.id) ?? [];
          if (docs.length === 0) return null;
          return (
            <section key={s.id} className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
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
                  const statusClass = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending;
                  const isReady = d.status === "complete";
                  return (
                    <article
                      key={d.id}
                      className="flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {d._category && (
                          <Badge variant="outline" className="text-[10px]">
                            {d._category}
                          </Badge>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass}`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-sm font-medium">{d._label}</h3>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {d.word_count ? `${d.word_count.toLocaleString()} words` : "—"}
                        {d.updated_at
                          ? ` · Updated ${new Date(d.updated_at).toLocaleDateString()}`
                          : ""}
                      </div>
                      {debouncedQuery && d._snippet && (
                        <p className="mt-2 line-clamp-3 rounded-md bg-muted/40 p-2 text-[11px] italic text-muted-foreground">
                          {d._snippet}
                        </p>
                      )}
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
