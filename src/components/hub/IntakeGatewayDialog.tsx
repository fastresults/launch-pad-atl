// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, Plus, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getCanonicalFounderContext,
  provenanceLabel,
  type CanonicalFounderContext,
} from "@/lib/canonical-context";

// Common intake field ids → canonical context lookups. Anything not listed
// falls through to the field's schema default. Keep this conservative so we
// don't accidentally overwrite legitimately different per-deliverable inputs.
const CANONICAL_FIELD_MAP: Record<string, (c: CanonicalFounderContext) => { v: any; src: string }> = {
  company_name: (c) => ({ v: c.concept.company_name, src: c.provenance.company_name ?? "" }),
  business_name: (c) => ({ v: c.concept.company_name, src: c.provenance.company_name ?? "" }),
  industry: (c) => ({ v: c.market.industry, src: c.provenance.industry ?? "" }),
  stage: (c) => ({ v: c.market.stage, src: c.provenance.stage ?? "" }),
  customer_type: (c) => ({ v: c.market.customer_type, src: c.provenance.customer_type ?? "" }),
  target_customer: (c) => ({ v: c.concept.target_customer, src: c.provenance.target_customer ?? "" }),
  target_market: (c) => ({ v: c.concept.target_customer, src: c.provenance.target_customer ?? "" }),
  one_line_pitch: (c) => ({ v: c.concept.one_line_pitch, src: c.provenance.one_line_pitch ?? "" }),
  problem_statement: (c) => ({ v: c.concept.problem_statement, src: c.provenance.problem_statement ?? "" }),
  offer_description: (c) => ({ v: c.concept.offer_description, src: c.provenance.offer_description ?? "" }),
  business_model: (c) => ({ v: c.concept.business_model, src: c.provenance.business_model ?? "" }),
  pricing_idea: (c) => ({ v: c.concept.pricing_idea, src: c.provenance.pricing_idea ?? "" }),
  unique_insight: (c) => ({ v: c.concept.unique_insight, src: c.provenance.unique_insight ?? "" }),
  twelve_month_vision: (c) => ({ v: c.concept.twelve_month_vision, src: c.provenance.twelve_month_vision ?? "" }),
  founder_name: (c) => ({ v: c.identity.full_name, src: c.provenance.full_name ?? "" }),
  full_name: (c) => ({ v: c.identity.full_name, src: c.provenance.full_name ?? "" }),
  email: (c) => ({ v: c.identity.email, src: c.provenance.email ?? "" }),
  phone: (c) => ({ v: c.identity.phone, src: c.provenance.phone ?? "" }),
  current_revenue: (c) => ({ v: c.financials.current_revenue ?? "", src: c.financials.current_revenue != null ? "profile" : "" }),
  monthly_burn: (c) => ({ v: c.financials.monthly_burn ?? "", src: c.financials.monthly_burn != null ? "profile" : "" }),
  runway_months: (c) => ({ v: c.financials.runway_months ?? "", src: c.financials.runway_months != null ? "profile" : "" }),
  funding_raised: (c) => ({ v: c.financials.funding_raised ?? "", src: c.financials.funding_raised != null ? "profile" : "" }),
};

/**
 * Field shapes supported by intake_schema:
 *   { id, label, type: 'text'|'textarea'|'number'|'currency'|'percent'|'select',
 *     required?, help?, placeholder?, default?, options?, rows?, quickTags?, allowVoice? }
 *   { id, label, type: 'rows', columns: [{ id, label, type, placeholder }], help? }
 */
export type IntakeField = any;
export type IntakeSchema = { version?: number; description?: string; fields: IntakeField[] } | null;

export type IntakeTarget = {
  type: string;
  name: string;
  schema: IntakeSchema;
  initial?: Record<string, any> | null;
  isRegenerate?: boolean;
} | null;

interface Props {
  target: IntakeTarget;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => void;
}

function defaultForField(f: IntakeField): any {
  if (f.type === "rows") return [];
  if (f.default !== undefined) return f.default;
  return "";
}

function isFilled(v: any) {
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined && String(v).trim().length > 0;
}

export function IntakeGatewayDialog({ target, onClose, onSubmit }: Props) {
  const fields: IntakeField[] = target?.schema?.fields ?? [];
  const [values, setValues] = useState<Record<string, any>>({});
  const [prefillSources, setPrefillSources] = useState<Record<string, string>>({});
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const [transcribingFor, setTranscribingFor] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Seed values when target changes — pulls from canonical context for any
  // field id that maps to a known fact, so founders don't re-type identity,
  // industry, financials, etc.
  useEffect(() => {
    if (!target) {
      stopTracks();
      setValues({});
      setPrefillSources({});
      return;
    }
    let cancelled = false;
    (async () => {
      const ctx = await getCanonicalFounderContext().catch(() => null);
      if (cancelled) return;
      const seed: Record<string, any> = {};
      const sources: Record<string, string> = {};
      for (const f of fields) {
        const fromInitial = target.initial?.[f.id];
        if (fromInitial !== undefined && fromInitial !== null && String(fromInitial).length > 0) {
          seed[f.id] = fromInitial;
          continue;
        }
        const mapper = ctx ? CANONICAL_FIELD_MAP[f.id] : null;
        if (mapper) {
          const { v, src } = mapper(ctx!);
          if (v !== "" && v !== null && v !== undefined) {
            seed[f.id] = v;
            if (src) sources[f.id] = src;
            continue;
          }
        }
        seed[f.id] = defaultForField(f);
      }
      setValues(seed);
      setPrefillSources(sources);
    })();
    return () => { cancelled = true; };
  }, [target?.type, target?.initial]);

  useEffect(() => () => stopTracks(), []);

  function stopTracks() {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording(fieldId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mimeType) {
        stream.getTracks().forEach((t) => t.stop());
        toast.error("This browser can't record a supported audio format.");
        return;
      }
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size < 1024) {
          toast.error("That recording was empty — please try again.");
          return;
        }
        await transcribe(fieldId, blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
      setRecordingFor(fieldId);
    } catch {
      toast.error("Microphone access is needed to record.");
    }
  }

  function stopRecording() {
    setRecordingFor(null);
    recorderRef.current?.stop();
  }

  async function transcribe(fieldId: string, blob: Blob) {
    setTranscribingFor(fieldId);
    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("file", blob, `recording.${ext}`);
      const { data, error } = await supabase.functions.invoke("venture-transcribe", { body: form });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const text: string = data?.text ?? "";
      if (text) {
        setValues((v) => ({
          ...v,
          [fieldId]: v[fieldId] ? `${String(v[fieldId]).trim()}\n${text}` : text,
        }));
      } else {
        toast.error("Couldn't transcribe — try typing instead.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setTranscribingFor(null);
    }
  }

  function setField(id: string, val: any) {
    setValues((v) => ({ ...v, [id]: val }));
  }

  function addRow(f: IntakeField) {
    const empty: Record<string, any> = {};
    for (const c of f.columns ?? []) empty[c.id] = "";
    setValues((v) => ({ ...v, [f.id]: [...(v[f.id] ?? []), empty] }));
  }
  function removeRow(f: IntakeField, idx: number) {
    setValues((v) => ({ ...v, [f.id]: (v[f.id] ?? []).filter((_: any, i: number) => i !== idx) }));
  }
  function setRowCell(f: IntakeField, idx: number, cid: string, val: any) {
    setValues((v) => {
      const rows = [...(v[f.id] ?? [])];
      rows[idx] = { ...rows[idx], [cid]: val };
      return { ...v, [f.id]: rows };
    });
  }

  function toggleTag(f: IntakeField, tag: string) {
    const cur = String(values[f.id] ?? "");
    const line = `[${tag}]`;
    if (cur.includes(line)) return; // single-shot append
    setValues((v) => ({ ...v, [f.id]: cur ? `${cur.trim()}\n${line}` : line }));
  }

  const missingRequired = useMemo(
    () => fields.filter((f) => f.required && !isFilled(values[f.id])).map((f) => f.label),
    [fields, values],
  );

  const canSubmit =
    missingRequired.length === 0 && !recordingFor && !transcribingFor && target !== null;

  const open = target !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{target?.name ?? "Document"} — quick inputs</DialogTitle>
          <DialogDescription>
            {target?.schema?.description ??
              "Answer a few quick questions so this document reflects your real numbers, not generic placeholders."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {fields.map((f) => {
            const v = values[f.id];
            const isRec = recordingFor === f.id;
            const isTrans = transcribingFor === f.id;
            return (
              <div key={f.id} className="space-y-1.5">
                <Label className="flex items-center gap-2 text-sm">
                  <span>{f.label}</span>
                  {f.required && <span className="text-status-danger">*</span>}
                </Label>
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}

                {f.type === "textarea" && (
                  <div className="relative">
                    <Textarea
                      value={v ?? ""}
                      onChange={(e) => setField(f.id, e.target.value)}
                      rows={f.rows ?? 4}
                      placeholder={f.placeholder}
                      className={f.allowVoice ? "pr-12" : ""}
                      disabled={isTrans}
                    />
                    {f.allowVoice && (
                      <button
                        type="button"
                        onClick={isRec ? stopRecording : () => startRecording(f.id)}
                        disabled={isTrans || (!!recordingFor && !isRec)}
                        aria-label={isRec ? "Stop recording" : "Start voice input"}
                        className={`absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-50 ${
                          isRec ? "border-status-danger text-status-danger" : ""
                        }`}
                      >
                        {isTrans ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isRec ? (
                          <Square className="h-4 w-4 fill-current" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {(isRec || isTrans) && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {isRec && (
                          <>
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-status-danger" />
                            <span>Listening… {elapsed}s — tap stop when done</span>
                          </>
                        )}
                        {isTrans && (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Transcribing…</span>
                          </>
                        )}
                      </div>
                    )}
                    {Array.isArray(f.quickTags) && f.quickTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {f.quickTags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer select-none"
                            onClick={() => toggleTag(f, tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(f.type === "text" || f.type === "number" || f.type === "currency" || f.type === "percent") && (
                  <div className="relative">
                    {(f.type === "currency" || f.type === "percent") && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {f.type === "currency" ? "$" : "%"}
                      </span>
                    )}
                    <Input
                      type={f.type === "text" ? "text" : "number"}
                      inputMode={f.type === "text" ? undefined : "decimal"}
                      value={v ?? ""}
                      onChange={(e) => setField(f.id, e.target.value)}
                      placeholder={f.placeholder}
                      className={f.type === "currency" || f.type === "percent" ? "pl-7" : ""}
                    />
                  </div>
                )}

                {f.type === "select" && (
                  <Select value={String(v ?? "")} onValueChange={(val) => setField(f.id, val)}>
                    <SelectTrigger><SelectValue placeholder="Choose one…" /></SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {f.type === "rows" && (
                  <div className="space-y-2">
                    {(v ?? []).length === 0 && (
                      <p className="text-xs italic text-muted-foreground">No rows yet.</p>
                    )}
                    {(v ?? []).map((row: any, idx: number) => (
                      <div key={idx} className="flex items-end gap-2 rounded-md border border-white/10 bg-card/40 p-2">
                        <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${(f.columns ?? []).length}, minmax(0,1fr))` }}>
                          {(f.columns ?? []).map((c: any) => (
                            <div key={c.id}>
                              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</Label>
                              <Input
                                type={c.type === "number" || c.type === "currency" ? "number" : "text"}
                                inputMode={c.type === "text" ? undefined : "decimal"}
                                value={row[c.id] ?? ""}
                                onChange={(e) => setRowCell(f, idx, c.id, e.target.value)}
                                placeholder={c.placeholder}
                                className="h-8"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => removeRow(f, idx)}
                          aria-label="Remove row"
                          className="text-muted-foreground hover:text-status-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" type="button" onClick={() => addRow(f)}>
                      <Plus className="mr-1 h-3 w-3" /> Add row
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {missingRequired.length > 0 && (
            <p className="text-xs text-status-warning">
              Still needed: {missingRequired.join(", ")}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!canSubmit} onClick={() => onSubmit(values)}>
            {target?.isRegenerate ? "Save & regenerate" : "Save & generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
