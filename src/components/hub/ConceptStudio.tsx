// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Lightbulb, Rocket, ShieldAlert, Lock, Unlock, History, CheckCircle2 } from "lucide-react";
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
    setSummary(s); setVp(v);
    try {
      await run.mutateAsync({ action: "apply", payload: { summary: s, value_proposition: v } });
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-semibold">Concept Studio</h3>
            {locked
              ? <Badge variant="outline" className="border-emerald-500/40 text-emerald-300"><Lock className="mr-1 h-3 w-3" />Locked</Badge>
              : <Badge variant="outline">Refining</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Lock a tight {WORD_MIN}–{WORD_MAX} word summary + value proposition. This becomes the north-star for all 21 documents.
          </p>
        </div>
        {!locked && !snapshot.concept_summary && (
          <Button size="sm" variant="outline" onClick={draft} disabled={run.isPending}>
            {run.isPending && run.variables?.action === "draft" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            Draft from research
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Concept summary</Label>
            <span className={`text-[10px] ${validWords ? "text-emerald-400" : "text-muted-foreground"}`}>
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
        <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-3">
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
                  <div key={i} className="rounded-lg border border-white/10 bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{idea.title}</div>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => applyDraft(idea.summary, idea.value_proposition)}>
                        <CheckCircle2 className="mr-1 h-3 w-3" />Use this
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{idea.summary}</p>
                    {idea.why_it_works && <p className="mt-1 text-[11px] text-emerald-300/80"><b>Why:</b> {idea.why_it_works}</p>}
                    {idea.risks && <p className="text-[11px] text-amber-300/80"><b>Risks:</b> {idea.risks}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {critique && (
            <div className="rounded-lg border border-white/10 bg-card p-3">
              <div className="text-xs font-medium text-muted-foreground">Red-team findings</div>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                {(critique.weaknesses ?? []).map((w: any, i: number) => (
                  <li key={i}><b>{w.issue}</b> — <span className="text-muted-foreground">{w.evidence}</span></li>
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <button onClick={() => setShowHistory((v) => !v)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <History className="h-3 w-3" />{iterations.length} iteration{iterations.length === 1 ? "" : "s"}
        </button>
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
        <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-white/10 bg-background/40 p-2 text-xs">
          {iterations.map((it: any) => (
            <div key={it.id} className="rounded border border-white/5 bg-card p-2">
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
  );
}
