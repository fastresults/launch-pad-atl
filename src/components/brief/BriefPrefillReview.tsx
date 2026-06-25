import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BRIEF_FIELDS } from "@/lib/workflow";
import type { BriefKey } from "@/lib/workflow";
import { updateBriefField, type BriefPrefillResponse } from "@/lib/brief.functions";
import { toast } from "sonner";

type Row = {
  key: BriefKey;
  label: string;
  answer: string;
  source: string;
  snippet: string;
  confidence: "high" | "medium" | "low";
  use: boolean;
};

export function BriefPrefillReview({
  open,
  data,
  onClose,
  onApplied,
}: {
  open: boolean;
  data: BriefPrefillResponse | null;
  onClose: () => void;
  onApplied: (accepted: Record<BriefKey, string>) => void;
}) {
  const initial = useMemo<Row[]>(() => {
    if (!data) return [];
    return BRIEF_FIELDS.map((f) => {
      const s = data.suggestions[f.key as BriefKey];
      return {
        key: f.key as BriefKey,
        label: f.label,
        answer: s?.answer ?? "",
        source: s?.source_filename ?? "",
        snippet: s?.source_snippet ?? "",
        confidence: (s?.confidence ?? "low") as Row["confidence"],
        use: !!(s?.answer && s.answer.trim().length > 0),
      };
    });
  }, [data]);

  const [rows, setRows] = useState<Row[]>(initial);
  const [saving, setSaving] = useState(false);

  // Reset rows when data changes
  useMemo(() => { setRows(initial); }, [initial]);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const setAll = (use: boolean) =>
    setRows((prev) => prev.map((r) => ({ ...r, use: use && r.answer.trim().length > 0 })));

  const apply = async () => {
    const toSave = rows.filter((r) => r.use && r.answer.trim().length > 0);
    if (toSave.length === 0) {
      toast.error("Select at least one answer to use.");
      return;
    }
    setSaving(true);
    try {
      const accepted: Partial<Record<BriefKey, string>> = {};
      for (const r of toSave) {
        await updateBriefField({ key: r.key, value: r.answer.trim() });
        accepted[r.key] = r.answer.trim();
      }
      toast.success(`Filled in ${toSave.length} answer${toSave.length === 1 ? "" : "s"} — review and tweak as needed.`);
      onApplied(accepted as Record<BriefKey, string>);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save answers.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;
  const selectedCount = rows.filter((r) => r.use).length;
  const usableCount = rows.filter((r) => r.answer.trim().length > 0).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review what we found</DialogTitle>
          <DialogDescription>
            {usableCount > 0
              ? `We pulled draft answers for ${usableCount} of 10 questions from ${data.sourceFiles.join(", ")}. Edit anything, then choose which to use.`
              : "We couldn't confidently answer the questions from those docs. You can still type your own answers."}
          </DialogDescription>
        </DialogHeader>

        {data.warnings.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <div className="font-medium">Some files couldn't be read:</div>
            <ul className="mt-1 list-disc pl-4">
              {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{selectedCount} of {usableCount} selected</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAll(true)} className="hover:text-foreground">Select all</button>
            <button type="button" onClick={() => setAll(false)} className="hover:text-foreground">Clear</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {rows.map((r, i) => (
            <div key={r.key} className={`rounded-lg border p-3 ${r.use ? "border-primary/30 bg-primary/5" : "border-border"}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={r.use}
                  onCheckedChange={(c) => update(i, { use: !!c })}
                  disabled={r.answer.trim().length === 0}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium">{r.label}</label>
                    <span
                      className={`text-[10px] uppercase tracking-wide ${
                        r.confidence === "high"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : r.confidence === "medium"
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {r.confidence}
                    </span>
                  </div>
                  <Textarea
                    value={r.answer}
                    onChange={(e) => update(i, { answer: e.target.value, use: e.target.value.trim().length > 0 && r.use })}
                    placeholder={r.answer ? "" : "Not covered in your docs — type your own answer or leave for the wizard"}
                    rows={r.answer.length > 140 ? 4 : 2}
                    className="mt-2 text-sm"
                  />
                  {r.snippet && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      from <span className="font-medium">{r.source || "your docs"}</span>: "{r.snippet}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Discard</Button>
          <Button onClick={apply} disabled={saving || selectedCount === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : `Use ${selectedCount} & continue`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
