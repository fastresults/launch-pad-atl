import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Check, Loader2, PenLine, RotateCcw, Sparkles, Upload, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { invokeEdge } from "@/lib/edge-invoke";

/**
 * Logo Studio — an AI art director interviewing the founder while it draws.
 *
 * It opens with a written brief of about 100 words proposing one mark. Once the
 * founder approves the brief, exactly one mark is drawn and evolved question by
 * question. The rough they approve is the artwork that gets vectored.
 */

type Rough = { id: string; title: string; brief: string; change_note?: string; url: string | null; provider: string };
type Step = {
  index: number;
  question: string;
  helper: string;
  read_back: string | null;
  choices: { label: string; description: string }[];
  allow_free_text: boolean;
  multi_select: boolean;
  done: boolean;
  roughs: Rough[];
  render_error: string | null;
  answer: string | null;
  chosen_rough_id: string | null;
};
type Session = {
  id: string;
  status: "briefing" | "interviewing" | "approved" | "committed";
  brief: {
    summary?: string;
    proposal?: string;
    direction?: { title: string; render_brief: string };
    requirements?: string[];
  } | null;
  steps: Step[];
  approved_rough: Rough | null;
  vector_svg: string | null;
  traced: boolean | null;
  last_error: string | null;
  brand?: { companyName: string; headingFont: string | null; primary: string | null } | null;
};

/** True when the founder has asked for the company name to sit beside the symbol. */
const LOCKUP_RE = /\b(wordmark|company name|text to the|type to the|lockup|name beside|letters beside|name to the right)\b/i;



async function studio(payload: Record<string, unknown>): Promise<any> {
  const { data, error } = await invokeEdge("venture-logo-studio", { body: payload });
  if (error) throw new Error((data as any)?.error || error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export default function LogoStudio({
  snapshotId,
  onCommitted,
}: {
  snapshotId: string;
  onCommitted?: (asset: any) => void;
}) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [freeText, setFreeText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [refineFor, setRefineFor] = useState<Rough | null>(null);
  const [refineNote, setRefineNote] = useState("");
  const [briefNote, setBriefNote] = useState("");
  const bottom = useRef<HTMLDivElement>(null);


  const existing = useQuery({
    queryKey: ["logoStudio", snapshotId],
    queryFn: () => studio({ action: "get", snapshotId }),
  });

  useEffect(() => {
    if (existing.data?.session) setSession(existing.data.session);
  }, [existing.data]);

  const steps = session?.steps ?? [];
  // A typography request is honoured as a typeset lockup beside the symbol,
  // never as letters drawn inside the artwork.
  const wantsLockup = (session?.brief?.requirements ?? []).some((r) => LOCKUP_RE.test(r));

  const current = steps[steps.length - 1] ?? null;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length, session?.status]);

  const land = (data: any) => {
    if (data?.session) setSession(data.session);
    setFreeText("");
    setPicked([]);
  };

  const start = useMutation({
    mutationFn: () => studio({ action: "start", snapshotId }),
    onSuccess: (data) => { land(data); toast.success("Your art director has written a brief"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reviseBrief = useMutation({
    mutationFn: (instruction: string) =>
      studio({ action: "revise_brief", snapshotId, sessionId: session?.id, instruction }),
    onSuccess: (data) => { land(data); setBriefNote(""); toast.success("Brief rewritten"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Approving carries any note still sitting in the box — a typed correction is
  // never silently dropped on the way to the first drawing.
  const approveBrief = useMutation({
    mutationFn: (instruction?: string) =>
      studio({ action: "approve_brief", snapshotId, sessionId: session?.id, instruction: instruction ?? "" }),
    onSuccess: (data) => { land(data); setBriefNote(""); toast.success("Drawing your first mark"); },
    onError: (e: any) => toast.error(e.message),
  });

  const dropRequirement = useMutation({
    mutationFn: (requirement: string) =>
      studio({ action: "drop_requirement", snapshotId, sessionId: session?.id, requirement }),
    onSuccess: land,
    onError: (e: any) => toast.error(e.message),
  });



  const answer = useMutation({
    mutationFn: (vars: { answer: string; chosenRoughId?: string | null }) =>
      studio({ action: "answer", snapshotId, sessionId: session?.id, ...vars }),
    onSuccess: land,
    onError: (e: any) => toast.error(e.message),
  });

  const back = useMutation({
    mutationFn: (toStep: number) => studio({ action: "back", snapshotId, sessionId: session?.id, toStep }),
    onSuccess: land,
    onError: (e: any) => toast.error(e.message),
  });

  const refine = useMutation({
    mutationFn: (vars: { roughId: string; instruction: string }) =>
      studio({ action: "refine", snapshotId, sessionId: session?.id, ...vars }),
    onSuccess: (data) => { land(data); setRefineFor(null); setRefineNote(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: (roughId: string) => studio({ action: "approve", snapshotId, sessionId: session?.id, roughId }),
    onSuccess: (data) => {
      land(data);
      toast[data?.traced ? "success" : "warning"](
        data?.traced ? "Traced to clean vectors in your brand colours" : data?.note ?? "Saved, but tracing fell back",
      );
    },
    onError: (e: any) => toast.error(e.message),
  });

  const commit = useMutation({
    mutationFn: () => studio({ action: "commit", snapshotId, sessionId: session?.id }),
    onSuccess: (data) => {
      land(data);
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      onCommitted?.(data?.asset);
      toast.success("Logo family saved to your Live Brand");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadOwn = useMutation({
    mutationFn: async (file: File) => {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of buf) binary += String.fromCharCode(byte);
      return studio({
        action: "upload_own",
        snapshotId,
        sessionId: session?.id,
        mime: file.type,
        data: btoa(binary),
      });
    },
    onSuccess: (data) => { land(data); toast.success("Your mark is vectored and ready to save"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => studio({ action: "reset", snapshotId, sessionId: session?.id }),
    onSuccess: () => { setSession(null); toast.success("Studio cleared"); },
    onError: (e: any) => toast.error(e.message),
  });

  const busy =
    start.isPending || answer.isPending || refine.isPending || back.isPending ||
    approve.isPending || commit.isPending || uploadOwn.isPending ||
    approveBrief.isPending || reviseBrief.isPending;

  const submitAnswer = (chosenRoughId?: string | null) => {
    const text = [...picked, freeText.trim()].filter(Boolean).join("; ");
    if (!text && !chosenRoughId) {
      toast.error("Pick an option or tell the designer what you want");
      return;
    }
    answer.mutate({ answer: text, chosenRoughId: chosenRoughId ?? null });
  };

  /* ------------------------------ empty state ------------------------------ */

  if (existing.isLoading) {
    return (
      <section className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening the studio…
      </section>
    );
  }

  if (!session) {
    return (
      <section className="space-y-4 rounded-xl border border-white/10 bg-background/40 p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Logo Studio</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            An art director who has already read your venture — your concept, customer, positioning and brand
            personality. It opens with a short written brief proposing one mark. Approve the brief and it draws
            that mark, then refines it with you one question at a time. Approve the mark and it's vectored on
            the spot, in your colours.
          </p>
        </div>
        <Button onClick={() => start.mutate()} disabled={start.isPending} size="sm">
          {start.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
          {start.isPending ? "Reading your venture…" : "Start the design session"}
        </Button>
      </section>
    );
  }

  /* ------------------------------ the brief ------------------------------ */

  if (session.status === "briefing") {
    return (
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-sm font-semibold">Logo Studio — the brief</h3>
          <Button variant="ghost" size="sm" onClick={() => reset.mutate()} disabled={busy || reset.isPending}>
            <RotateCcw className="mr-1 h-4 w-4" /> Start over
          </Button>
        </div>

        <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary">
            <PenLine className="h-3.5 w-3.5" /> Design brief
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">{session.brief?.proposal}</p>
          {session.brief?.direction?.title && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">The mark:</span> {session.brief.direction.title}
            </p>
          )}

          <RequirementLedger
            requirements={session.brief?.requirements ?? []}
            busy={busy}
            onDrop={(r) => dropRequirement.mutate(r)}
          />

          <div className="space-y-2 border-t border-white/10 pt-3">
            <Textarea
              value={briefNote}
              onChange={(e) => setBriefNote(e.target.value)}
              rows={2}
              disabled={busy}
              placeholder="Anything to correct before it draws? e.g. show both an elderly person and a caregiver, company name to the right."
              className="text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={busy} onClick={() => approveBrief.mutate(briefNote.trim() || undefined)}>
                {approveBrief.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                {approveBrief.isPending
                  ? "Drawing the first mark…"
                  : briefNote.trim() ? "Apply my note & draw it" : "Approve the brief & draw it"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || !briefNote.trim()}
                onClick={() => reviseBrief.mutate(briefNote.trim())}
              >
                {reviseBrief.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                Rewrite the brief first
              </Button>
            </div>
            {briefNote.trim() && (
              <p className="text-[11px] text-primary/80">
                Your note will be locked in as a requirement before anything is drawn.
              </p>
            )}
          </div>
        </div>

      </section>
    );
  }

  /* -------------------------------- session -------------------------------- */

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Logo Studio</h3>
          {session.brief?.summary && (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Brief so far:</span> {session.brief.summary}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => reset.mutate()} disabled={busy || reset.isPending}>
          <RotateCcw className="mr-1 h-4 w-4" /> Start over
        </Button>
      </div>

      <RequirementLedger
        requirements={session.brief?.requirements ?? []}
        busy={busy}
        onDrop={(r) => dropRequirement.mutate(r)}
      />




      {session.last_error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
          {session.last_error}
        </p>
      )}

      {/* Conversation */}
      <div className="space-y-6">
        {steps.map((step, i) => {
          const isCurrent = i === steps.length - 1;
          const answered = step.answer !== null;
          return (
            <div key={i} className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {step.read_back && (
                    <p className="mb-1 text-[11px] italic text-muted-foreground">{step.read_back}</p>
                  )}
                  <p className="text-sm font-medium">{step.question}</p>
                  {step.helper && <p className="mt-0.5 text-xs text-muted-foreground">{step.helper}</p>}
                </div>
                {i > 0 && isCurrent && (
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => back.mutate(i - 1)}>
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
                  </Button>
                )}
              </div>

              {/* The mark drawn for this turn — one, always */}
              {step.roughs.length > 0 && (
                <div className="pl-8">
                  {step.roughs.map((rough) => {
                    const chosen = step.chosen_rough_id === rough.id;
                    if (!isCurrent) {
                      return (
                        <div key={rough.id} className="flex items-center gap-3">
                          {rough.url && (
                            <img
                              src={rough.url}
                              alt={rough.title}
                              className={`h-16 w-16 shrink-0 rounded border bg-white object-contain p-1 ${
                                chosen ? "border-primary" : "border-white/10"
                              }`}
                            />
                          )}
                          <p className="text-[11px] text-muted-foreground">{rough.title}</p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={rough.id}
                        className="max-w-sm overflow-hidden rounded-xl border border-primary/40 ring-1 ring-primary/20"
                      >
                        {rough.url ? (
                          <img src={rough.url} alt={rough.title} className="aspect-square w-full bg-white object-contain" />
                        ) : (
                          <div className="flex aspect-square items-center justify-center bg-white/5 text-[11px] text-muted-foreground">
                            Not drawn
                          </div>
                        )}
                        {wantsLockup && (
                          <LockupPreview
                            markUrl={rough.url}
                            name={session.brand?.companyName ?? ""}
                            font={session.brand?.headingFont ?? null}
                          />
                        )}
                        <div className="space-y-2 p-3">
                          <div>
                            <p className="text-sm font-semibold">{rough.title}</p>
                            {rough.change_note && (
                              <p className="mt-0.5 text-[11px] font-medium text-primary">{rough.change_note}</p>
                            )}
                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{rough.brief}</p>
                          </div>

                          {!answered && (
                            <div className="flex flex-wrap gap-1.5">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" disabled={busy}
                                onClick={() => { setRefineFor(rough); setRefineNote(""); }}>
                                <PenLine className="mr-1 h-3 w-3" /> Tweak this mark
                              </Button>
                              <Button size="sm" variant="secondary" className="h-7 px-2 text-[11px]" disabled={busy}
                                onClick={() => approve.mutate(rough.id)}>
                                <Check className="mr-1 h-3 w-3" /> Approve this mark
                              </Button>
                            </div>
                          )}
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{rough.provider}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}


              {step.render_error && isCurrent && (
                <p className="pl-8 text-[11px] text-amber-300">{step.render_error}</p>
              )}

              {/* Answer controls */}
              {isCurrent && !answered && session.status === "interviewing" && (
                <div className="space-y-2 pl-8">
                  {step.choices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {step.choices.map((choice) => {
                        const on = picked.includes(choice.label);
                        return (
                          <button
                            key={choice.label}
                            type="button"
                            title={choice.description}
                            disabled={busy}
                            onClick={() =>
                              setPicked((prev) =>
                                step.multi_select
                                  ? on ? prev.filter((p) => p !== choice.label) : [...prev, choice.label]
                                  : on ? [] : [choice.label],
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] transition ${
                              on ? "border-primary bg-primary/10 text-foreground" : "border-white/15 text-muted-foreground hover:border-white/35"
                            }`}
                          >
                            {choice.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {step.allow_free_text && (
                    <Textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      rows={2}
                      disabled={busy}
                      placeholder="Or say it in your own words…"
                      className="text-sm"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" disabled={busy} onClick={() => submitAnswer(null)}>
                      {answer.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                      {answer.isPending ? "Redrawing…" : step.done ? "Draw the final pass" : "Answer & redraw"}
                    </Button>
                    {busy && <span className="text-[11px] text-muted-foreground">Redrawing the mark — about 15 seconds.</span>}

                  </div>
                </div>
              )}

              {answered && (
                <p className="pl-8 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">You said:</span> {step.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Approved + vectored */}
      {session.status !== "interviewing" && session.approved_rough && (
        <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {session.vector_svg && (
              <div
                className="h-20 w-20 rounded bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: session.vector_svg }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{session.approved_rough.title}</p>
              <p className="text-xs text-muted-foreground">
                {session.traced
                  ? "Traced to clean vector paths in your brand colours."
                  : "Saved as vector, though tracing fell back to an embedded image."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => back.mutate(steps.length - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Keep exploring
              </Button>
              <Button size="sm" disabled={busy || session.status === "committed"} onClick={() => commit.mutate()}>
                {commit.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                {session.status === "committed" ? "Saved to Live Brand" : "Save the logo family"}
              </Button>
            </div>
          </div>
          {session.status === "committed" && (
            <p className="text-[11px] text-muted-foreground">
              Primary mark, horizontal and stacked lockups, mono and knockout versions are all in your Live Brand.
            </p>
          )}
        </div>
      )}

      {/* Bring your own */}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/20 px-3 py-2 text-xs hover:border-primary/60">
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) uploadOwn.mutate(file);
          }}
        />
        {uploadOwn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploadOwn.isPending ? "Vectoring…" : "I already have a logo — use mine"}
      </label>

      {/* Refine dialog */}
      {refineFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="w-full max-w-lg space-y-3 rounded-xl border border-white/10 bg-background p-5">
            <div>
              <h4 className="text-sm font-semibold">Tweak “{refineFor.title}”</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Say what to change. The designer redraws three variations of this exact mark.
              </p>
            </div>
            {refineFor.url && (
              <img src={refineFor.url} alt={refineFor.title} className="h-24 w-24 rounded bg-white object-contain p-1" />
            )}
            <Textarea
              value={refineNote}
              onChange={(e) => setRefineNote(e.target.value)}
              rows={3}
              placeholder="e.g. Keep the arch, drop the leaf, make the stroke weight even throughout."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" disabled={refine.isPending} onClick={() => setRefineFor(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={refine.isPending || !refineNote.trim()}
                onClick={() => refine.mutate({ roughId: refineFor.id, instruction: refineNote.trim() })}
              >
                {refine.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                Redraw
              </Button>
            </div>
          </div>
        </div>
      )}

      <div ref={bottom} />
    </section>
  );
}
