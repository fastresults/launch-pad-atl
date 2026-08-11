// Creative sign-off board.
//
// One surface, two audiences. The studio (agency) submits work and publishes
// approved marks; the founder (client) approves or asks for changes. Both see
// the same trail so nothing is decided in a DM.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, Loader2, RotateCcw, Send, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OpsAuth } from "@/lib/ops.functions";
import {
  CREATIVE_KIND_LABEL,
  CREATIVE_STATE_CLASS,
  CREATIVE_STATE_LABEL,
  approveCreative,
  fetchCreativeReviews,
  publishCreative,
  requestCreativeChanges,
  resetCreative,
  submitCreative,
  unpublishCreative,
  type CreativeReview,
  type CreativeReviewEvent,
  type CreativeState,
} from "@/lib/creative-review.functions";

type Props = {
  auth: OpsAuth;
  /** Overrides the viewer role the endpoint reports (hub always acts as agency). */
  className?: string;
};

const FILTERS: { key: "all" | CreativeState; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "in_review", label: "Waiting on you" },
  { key: "changes_requested", label: "Changes requested" },
  { key: "approved", label: "Approved" },
  { key: "ready_to_publish", label: "Published" },
  { key: "draft", label: "Draft" },
];

export default function CreativeSignoffBoard({ auth, className }: Props) {
  const [items, setItems] = useState<CreativeReview[]>([]);
  const [events, setEvents] = useState<CreativeReviewEvent[]>([]);
  const [viewerKind, setViewerKind] = useState<"client" | "agency">("client");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CreativeState>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchCreativeReviews(auth);
      setItems(res.items);
      setEvents(res.events);
      setViewerKind(res.viewerKind);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load creative sign-off.");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => { void load(); }, [load]);

  const run = async (id: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(id);
    try {
      await fn();
      setComment("");
      setOpenId(null);
      await load();
      toast.success(done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't go through.");
    } finally {
      setBusy(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.state] = (c[i.state] ?? 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.state === filter)),
    [items, filter],
  );

  const grouped = useMemo(() => {
    const g = new Map<string, CreativeReview[]>();
    for (const i of visible) {
      const k = CREATIVE_KIND_LABEL[i.asset_kind] ?? i.asset_kind;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(i);
    }
    return Array.from(g.entries());
  }, [visible]);

  const eventsFor = (id: string) => events.filter((e) => e.review_id === id).slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading creative sign-off…
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        Nothing to elevate yet. Build the foundation set first — mark, collateral, social and ad
        creative — then it arrives here to be raised to the standard and signed off.
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Elevate, then sign off
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          What the build handed you is the foundation set, not the finished standard. Each piece gets
          raised to the written art direction — real imagery, one crop language, one type hierarchy —
          and only then does it get approved to publish.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {f.key !== "all" && counts[f.key] ? ` · ${counts[f.key]}` : ""}
          </button>
        ))}
      </div>

      {grouped.map(([group, rows]) => (
        <section key={group} className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{group}</h3>
          <div className="space-y-3">
            {rows.map((r) => {
              const open = openId === r.id;
              const isBusy = busy === r.id;
              return (
                <article key={r.id} className="rounded-lg border border-border bg-card/60 p-3">
                  <div className="flex items-start gap-3">
                    {r.previewUrl ? (
                      <img
                        src={r.previewUrl}
                        alt={r.label ?? "Creative preview"}
                        loading="lazy"
                        className="h-14 w-20 flex-none rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="h-14 w-20 flex-none rounded border border-dashed border-border" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{r.label ?? r.asset_ref}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px]", CREATIVE_STATE_CLASS[r.state])}>
                          {CREATIVE_STATE_LABEL[r.state]}
                        </span>
                      </div>
                      {r.last_comment && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">“{r.last_comment}”</p>
                      )}
                      {r.state === "in_review" && r.submitted_at && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> Submitted {new Date(r.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-none flex-wrap items-center justify-end gap-2">
                      {viewerKind === "agency" && (r.state === "draft" || r.state === "changes_requested") && (
                        <Button size="sm" variant="outline" disabled={isBusy}
                          onClick={() => run(r.id, () => submitCreative(auth, r.id), "Sent for review.")}>
                          <Send className="mr-1 h-3.5 w-3.5" />
                          {r.state === "changes_requested" ? "Resubmit" : "Submit for review"}
                        </Button>
                      )}
                      {r.state === "in_review" && (
                        <>
                          <Button size="sm" disabled={isBusy}
                            onClick={() => run(r.id, () => approveCreative(auth, r.id), "Approved.")}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={isBusy}
                            onClick={() => { setOpenId(open ? null : r.id); setComment(""); }}>
                            <X className="mr-1 h-3.5 w-3.5" /> Request changes
                          </Button>
                        </>
                      )}
                      {viewerKind === "agency" && r.state === "approved" && (
                        <Button size="sm" disabled={isBusy}
                          onClick={() => run(r.id, () => publishCreative(auth, r.id), "Published to the client link.")}>
                          Mark ready to publish
                        </Button>
                      )}
                      {viewerKind === "agency" && r.state === "ready_to_publish" && (
                        <Button size="sm" variant="ghost" disabled={isBusy}
                          onClick={() => run(r.id, () => unpublishCreative(auth, r.id), "Pulled from the client link.")}>
                          <Undo2 className="mr-1 h-3.5 w-3.5" /> Unpublish
                        </Button>
                      )}
                      {viewerKind === "agency" && r.state !== "draft" && (
                        <Button size="sm" variant="ghost" disabled={isBusy}
                          onClick={() => run(r.id, () => resetCreative(auth, r.id), "Reset to draft.")}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What needs to change? Be specific — colour, crop, copy, scale."
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setOpenId(null)}>Cancel</Button>
                        <Button
                          size="sm"
                          disabled={!comment.trim() || isBusy}
                          onClick={() => run(r.id, () => requestCreativeChanges(auth, r.id, comment.trim()), "Sent back to the studio.")}
                        >
                          Send feedback
                        </Button>
                      </div>
                    </div>
                  )}

                  {eventsFor(r.id).length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                      {eventsFor(r.id).map((e) => (
                        <li key={e.id}>
                          {new Date(e.created_at).toLocaleDateString()} · {e.actor_kind === "agency" ? "Studio" : "Founder"}
                          {" "}→ {CREATIVE_STATE_LABEL[e.to_state]}
                          {e.comment ? ` — ${e.comment}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
