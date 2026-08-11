// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Lightbulb, Rocket, ShieldAlert, Lock, Unlock, History, CheckCircle2, Zap, Bookmark, X } from "lucide-react";
import { toast } from "sonner";
import { refineConcept } from "@/lib/foundersHub.functions";

const WORD_MIN = 50;
const WORD_MAX = 60;

function wc(s: string) {
  return (s ?? "").trim().split(/\s+/).filter(Boolean).length;
}

export function ConceptStudio({ snapshot, onChanged }: { snapshot: any; onChanged: () => void }) {
  const qc = useQueryClient();
  const locked = snapshot.concept_status === "locked";
  const [summary, setSummary] = useState<string>(snapshot.concept_summary ?? "");
  const [vp, setVp] = useState<string>(snapshot.value_proposition ?? "");
  const [ideas, setIdeas] = useState<any[] | null>(null);
  const [critique, setCritique] = useState<any | null>(null);
  const [innovatePrompt, setInnovatePrompt] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Pull in latest server-side values when snapshot refreshes
  useEffect(() => {
    setSummary(snapshot.concept_summary ?? "");
    setVp(snapshot.value_proposition ?? "");
  }, [snapshot.id, snapshot.concept_summary, snapshot.value_proposition]);

  const sumWords = wc(summary);
  const validWords = sumWords >= WORD_MIN && sumWords <= WORD_MAX;
  const canLock = validWords && vp.trim().length > 0 && !locked;

  const run = useMutation({
    mutationFn: (args: { action: string; payload?: any }) =>
      refineConcept({ data: { snapshotId: snapshot.id, action: args.action, payload: args.payload } }),
  });

  const draft = async () => {
    try {
      const out = await run.mutateAsync({ action: "draft" });
      setSummary(out.summary ?? "");
      setVp(out.value_proposition ?? "");
      toast.success("Draft ready");
      qc.invalidateQueries({ queryKey: ["hub"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const brainstorm = async () => {
    try {
      const out = await run.mutateAsync({ action: "brainstorm", payload: { hint: innovatePrompt } });
      setIdeas(out.ideas ?? []);
    } catch (e: any) { toast.error(e.message); }
  };

  const innovate = async () => {
    try {
      const out = await run.mutateAsync({ action: "innovate", payload: { prompt: innovatePrompt } });
      setSummary(out.summary ?? "");
      setVp(out.value_proposition ?? "");
      toast.success(out.delta ? `Innovated: ${out.delta}` : "Innovated");
    } catch (e: any) { toast.error(e.message); }
  };

  const critiqueRun = async () => {
    try {
      const out = await run.mutateAsync({ action: "critique" });
      setCritique(out);
    } catch (e: any) { toast.error(e.message); }
  };

  const applyDraft = async (s: string, v: string) => {
    // AI responses occasionally omit one field — fall back to what's on screen
    // (or already saved) so "Use this" never fails with a 400.
    const nextSummary = (s ?? "").trim() || summary.trim() || (snapshot.concept_summary ?? "").trim();
    const nextVp = (v ?? "").trim() || vp.trim() || (snapshot.value_proposition ?? "").trim();
    if (!nextSummary || !nextVp) {
      toast.error("Add a concept summary and value proposition before applying.");
      return;
    }
    setSummary(nextSummary); setVp(nextVp);
    try {
      await run.mutateAsync({ action: "apply", payload: { summary: nextSummary, value_proposition: nextVp } });
      toast.success("Applied");
      onChanged();
    } catch (e: any) { toast.error(e.message); }
  };


  const lock = async () => {
    try {
      await run.mutateAsync({ action: "lock", payload: { summary, value_proposition: vp } });
      toast.success("Concept locked — generation unlocked");
      onChanged();
    } catch (e: any) { toast.error(e.message); }
  };

  const unlock = async () => {
    try {
      await run.mutateAsync({ action: "unlock" });
      toast.message("Concept unlocked for editing");
      onChanged();
    } catch (e: any) { toast.error(e.message); }
  };

  const iterations = Array.isArray(snapshot.concept_iterations) ? snapshot.concept_iterations : [];

  return (
    <div className="space-y-4">
      {/* ───────── STUDIOS INTRO BAND ───────── */}
      {!locked && (
        <div className="space-y-1 px-2 text-center">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-muted" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Two AI studios before you lock
            </span>
            <div className="h-px flex-1 bg-muted" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sharpen the wording, then optionally stress-test the idea.
          </p>
        </div>
      )}

      {/* ───────── STEP 1 · CONCEPT STUDIO ───────── */}
      <div className="space-y-4 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              AI Studio · 01
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Concept Studio</h3>
              {locked
                ? <Badge variant="outline" className="border-status-success/40 text-status-success"><Lock className="mr-1 h-3 w-3" />Locked</Badge>
                : <Badge variant="outline" className="border-primary/40 text-primary">Refining</Badge>}
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              Sharpen the wording of a concept you already believe in.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <b>When to use this:</b> the concept is roughly right and you just need a tight {WORD_MIN}–{WORD_MAX} word north-star + value prop. This locks the language used across all your startup assets.
            </p>
          </div>
          {!locked && !snapshot.concept_summary && (
            <Button size="sm" onClick={draft} disabled={run.isPending}>
              {run.isPending && run.variables?.action === "draft" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Draft from research
            </Button>
          )}
        </div>

        <div className="grid gap-3 rounded-xl bg-background/40 p-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Concept summary</Label>
              <span className={`text-[10px] ${validWords ? "text-status-success" : "text-muted-foreground"}`}>
                {sumWords} / {WORD_MIN}-{WORD_MAX} words
              </span>
            </div>
            <Textarea rows={4} value={summary} disabled={locked}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="50-60 word concept: who it's for, the problem, your offer, your unfair edge." />
            {!locked && (
              <Button size="sm" variant="ghost" onClick={draft} disabled={run.isPending} className="h-7 px-2 text-xs">
                <Sparkles className="mr-1 h-3 w-3" />Regenerate from research
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Competitive value proposition</Label>
            <Textarea rows={2} value={vp} disabled={locked}
              onChange={(e) => setVp(e.target.value)}
              placeholder="1-2 sentences. Why customers pick you over the alternatives." />
          </div>
        </div>

        {!locked && (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Refine & innovate</div>
            <Textarea rows={2} placeholder="Optional hint — e.g. 'challenge our pricing model', 'serve underserved segment X'"
              value={innovatePrompt} onChange={(e) => setInnovatePrompt(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={brainstorm} disabled={run.isPending}>
                <Lightbulb className="mr-1 h-3 w-3" />Brainstorm alternatives
              </Button>
              <Button size="sm" variant="outline" onClick={innovate} disabled={run.isPending}>
                <Rocket className="mr-1 h-3 w-3" />Push further
              </Button>
              <Button size="sm" variant="outline" onClick={critiqueRun} disabled={run.isPending}>
                <ShieldAlert className="mr-1 h-3 w-3" />Red-team critique
              </Button>
              {run.isPending && <Loader2 className="ml-1 h-4 w-4 animate-spin self-center text-muted-foreground" />}
            </div>

            {ideas && ideas.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Alternative angles</div>
                <div className="grid gap-2">
                  {ideas.map((idea, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium">{idea.title}</div>
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => applyDraft(idea.summary, idea.value_proposition)}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />Use this
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{idea.summary}</p>
                      {idea.why_it_works && (
                        <p className="mt-2 rounded-r-md border-l-2 border-status-success/60 bg-status-success/10 px-2 py-1 text-xs leading-snug text-status-success">
                          <b>Why:</b> {idea.why_it_works}
                        </p>
                      )}
                      {idea.risks && (
                        <p className="mt-1 rounded-r-md border-l-2 border-status-warning/60 bg-status-warning/10 px-2 py-1 text-xs leading-snug text-status-warning">
                          <b>Risks:</b> {idea.risks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {critique && (
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-medium text-muted-foreground">Red-team findings</div>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                  {(critique.weaknesses ?? []).map((w: any, i: number) => (
                    <li key={i}><b>{w.issue}</b> — <span className="text-foreground/80">{w.evidence}</span></li>
                  ))}
                </ul>
                {critique.suggested_rewrite && (
                  <div className="mt-2 flex items-start justify-between gap-2 rounded-md bg-background/60 p-2 text-xs">
                    <div>
                      <div className="font-medium">Suggested rewrite</div>
                      <div className="text-muted-foreground">{critique.suggested_rewrite.summary}</div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => applyDraft(critique.suggested_rewrite.summary, critique.suggested_rewrite.value_proposition)}>
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {/* ───────── DIVIDER ───────── */}
      {!locked && (
        <div className="flex items-center gap-3 px-2">
          <div className="h-px flex-1 bg-muted" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Optional deep pass</span>
          <div className="h-px flex-1 bg-muted" />
        </div>
      )}

      {/* ───────── STEP 2 · EPIPHANY ENGINE ───────── */}
      {!locked && <EpiphanyPanel snapshot={snapshot} onApplied={applyDraft} onChanged={onChanged} />}

      {/* ───────── DIVIDER ───────── */}
      <div className="flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ready?</span>
        <div className="h-px flex-1 bg-muted" />
      </div>

      {/* ───────── LOCK & CONTINUE ───────── */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory((v) => !v)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <History className="h-3 w-3" />{iterations.length} iteration{iterations.length === 1 ? "" : "s"}
            </button>
            <span className={`text-[11px] ${validWords ? "text-status-success" : "text-muted-foreground"}`}>
              {validWords ? "✓ concept length OK" : `${sumWords}/${WORD_MIN}-${WORD_MAX} words`}
            </span>
          </div>
          {locked ? (
            <Button size="sm" variant="outline" onClick={unlock} disabled={run.isPending}>
              <Unlock className="mr-1 h-3 w-3" />Unlock & revise
            </Button>
          ) : (
            <Button size="sm" onClick={lock} disabled={!canLock || run.isPending}>
              <Lock className="mr-1 h-3 w-3" />Lock concept
            </Button>
          )}
        </div>

        {showHistory && iterations.length > 0 && (
          <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background/40 p-2 text-xs">
            {iterations.map((it: any) => (
              <div key={it.id} className="rounded border border-border bg-card p-2">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span className="font-mono">{it.kind}</span>
                  <span>{new Date(it.created_at).toLocaleString()}</span>
                </div>
                {it.output?.summary && (
                  <div className="mt-1 line-clamp-3 text-[11px]">{it.output.summary}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function scoreColor(combined: number) {
  if (combined >= 160) return "bg-status-success/15 text-status-success border-status-success/40";
  if (combined >= 130) return "bg-status-warning/15 text-status-warning border-status-warning/40";
  return "bg-muted text-muted-foreground border-border";
}

function EpiphanyPanel({ snapshot, onApplied, onChanged }: { snapshot: any; onApplied: (s: string, v: string) => Promise<void>; onChanged: () => void }) {
  const lastRun = (snapshot.epiphany_runs ?? [])[0] ?? null;
  const [top3, setTop3] = useState<any[]>(lastRun?.top3 ?? []);
  const [execNote, setExecNote] = useState<string>(lastRun?.exec_note ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);
  const saved = Array.isArray(snapshot.saved_enhancements) ? snapshot.saved_enhancements : [];
  const hasBrief = !!snapshot.research_brief && Object.keys(snapshot.research_brief).length > 0;

  const run = useMutation({
    mutationFn: (args: { action: string; payload?: any }) =>
      refineConcept({ data: { snapshotId: snapshot.id, action: args.action, payload: args.payload } }),
  });

  const findEpiphany = async () => {
    try {
      const out = await run.mutateAsync({ action: "epiphany" });
      setTop3(out.top3 ?? []);
      setExecNote(out.exec_note ?? "");
      toast.success(`Found ${(out.top3 ?? []).length} ideas`);
      onChanged();
    } catch (e: any) { toast.error(e.message); }
  };

  const fold = async (card: any, savedId?: string) => {
    try {
      const out = await run.mutateAsync({ action: "fold_enhancement", payload: { card, id: savedId } });
      await onApplied(out.summary, out.value_proposition);
      toast.success(out.delta ? `Folded in: ${out.delta}` : "Folded into concept");
    } catch (e: any) { toast.error(e.message); }
  };

  const save = async (card: any) => {
    try { await run.mutateAsync({ action: "save_enhancement", payload: { card } }); toast.success("Saved"); onChanged(); }
    catch (e: any) { toast.error(e.message); }
  };

  const dismiss = async (id: string) => {
    try { await run.mutateAsync({ action: "dismiss_enhancement", payload: { id } }); onChanged(); }
    catch (e: any) { toast.error(e.message); }
  };

  const v = run.variables as { action?: string; payload?: any } | undefined;
  const isBusy = (action: string, key: string | null) =>
    run.isPending &&
    v?.action === action &&
    key !== null &&
    (v?.payload?.card?.title === key || v?.payload?.id === key);

  return (
    <div className="space-y-3 rounded-2xl border-2 border-status-warning/40 bg-gradient-to-br from-status-warning/10 via-card to-card p-5 shadow-[0_0_0_1px_hsl(var(--status-warning)/0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-status-warning">
            AI Studio · 02
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-status-warning/15">
              <Zap className="h-4 w-4 text-status-warning" />
            </div>
            <h4 className="text-lg font-semibold">Epiphany Engine</h4>
            <Badge variant="outline" className="border-status-warning/40 text-[10px] text-status-warning">deep</Badge>
          </div>
          <p className="mt-2 text-sm text-foreground/80">
            Challenge the concept itself — surface bigger swings you may have missed.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <b>When to use this:</b> before you lock, when you want your assumptions challenged rather than your wording polished. Multi-pass: mines your research, generates and scores enhancements, returns up to 3 vision-extending ideas. <i>Takes ~60s.</i>
          </p>
        </div>
        <Button size="sm" onClick={findEpiphany} disabled={run.isPending || !hasBrief}>
          {run.isPending && run.variables?.action === "epiphany"
            ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Thinking…</>
            : <><Zap className="mr-1 h-3 w-3" />Find my epiphany</>}
        </Button>
      </div>
      {!hasBrief && (
        <p className="text-[11px] text-status-warning">Deep research must complete first.</p>
      )}
      {execNote && <p className="text-xs italic text-muted-foreground">{execNote}</p>}


      {top3.length > 0 && (
        <div className="space-y-2">
          {top3.map((card: any, i: number) => {
            const id = `e${i}`;
            const open = expanded === id;
            return (
              <div key={id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${scoreColor(card.combined ?? 0)}`}>
                        {card.combined ?? 0}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{card.lens}</Badge>
                      <div className="truncate text-sm font-medium">{card.title}</div>
                    </div>
                    {card.why_now && (
                      <p className="mt-1 rounded-r-md border-l-2 border-status-warning/60 bg-status-warning/10 px-2 py-1 text-xs leading-snug text-status-warning">
                        <b>Why now:</b> {card.why_now}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{card.summary}</p>
                    <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                      <span>Viability <b className="text-foreground">{card.viability?.total ?? 0}</b>/100</span>
                      <span>Attractiveness <b className="text-foreground">{card.attractiveness?.total ?? 0}</b>/100</span>
                    </div>
                  </div>
                </div>

                {open && (
                  <div className="mt-2 space-y-2 border-t border-border pt-2 text-[11px]">
                    {card.first_30_days?.length > 0 && (
                      <div>
                        <div className="font-medium text-muted-foreground">First 30 days</div>
                        <ul className="list-disc space-y-0.5 pl-4">
                          {card.first_30_days.map((s: string, j: number) => <li key={j}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {card.risks?.length > 0 && (
                      <div>
                        <div className="font-medium text-muted-foreground">Risks</div>
                        <ul className="list-disc space-y-0.5 pl-4 text-status-warning">
                          {card.risks.map((s: string, j: number) => <li key={j}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {["viability", "attractiveness"].map((dim) => (
                        <div key={dim} className="rounded border border-border p-1.5">
                          <div className="text-[10px] font-medium uppercase text-muted-foreground">{dim}</div>
                          {Object.entries(card[dim] ?? {}).filter(([k]) => k !== "total").map(([k, v]: any) => (
                            <div key={k} className="flex justify-between gap-1">
                              <span className="truncate">{k.replace(/_/g, " ")}</span>
                              <span className="font-mono text-muted-foreground">{v?.score ?? "?"}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" className="h-7 text-xs" onClick={() => fold(card)} disabled={isBusy("fold_enhancement", card.title)}>
                    {isBusy("fold_enhancement", card.title)
                      ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Folding…</>
                      : <><Sparkles className="mr-1 h-3 w-3" />Fold into concept</>}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => save(card)} disabled={isBusy("save_enhancement", card.title)}>
                    {isBusy("save_enhancement", card.title)
                      ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Saving…</>
                      : <><Bookmark className="mr-1 h-3 w-3" />Save</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpanded(open ? null : id)}>
                    {open ? "Hide details" : "Details"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saved.filter((s: any) => s.status === "saved").length > 0 && (
        <details className="rounded-lg border border-border bg-background/40 p-2 text-xs">
          <summary className="cursor-pointer font-medium text-muted-foreground">Saved for later ({saved.filter((s: any) => s.status === "saved").length})</summary>
          <div className="mt-2 space-y-1.5">
            {saved.filter((s: any) => s.status === "saved").map((s: any) => (
              <div key={s.id} className="flex items-start justify-between gap-2 rounded border border-border p-1.5">
                <div className="min-w-0 flex-1 text-[11px]">
                  <div className="font-medium">{s.card.title}</div>
                  <div className="line-clamp-2 text-muted-foreground">{s.card.summary}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => fold(s.card, s.id)} disabled={isBusy("fold_enhancement", s.id)}>{isBusy("fold_enhancement", s.id) ? "Folding…" : "Fold"}</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => dismiss(s.id)} disabled={isBusy("dismiss_enhancement", s.id)}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

