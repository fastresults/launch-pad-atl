// @ts-nocheck
// "Confirm your details" — the gate in front of collateral generation.
//
// Every printed piece is only as good as the words on it, and nobody wants to
// discover a typo after a print run. This audits what we already know about the
// venture, shows what's missing or looks wrong, and makes the founder sign off
// once. Saving normalises everything so all nine pieces agree.

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  FIELD_SPECS, KIND_LABEL, auditDetails, normalizeField,
} from "@/lib/brand/collateral-fields";
import { getCollateralDetails, rescanCollateralDetails, saveCollateralDetails } from "@/lib/collateral.functions";


const GROUPS: Array<{ key: string; label: string; blurb: string }> = [
  { key: "identity", label: "Identity", blurb: "The name and line that appear on every piece." },
  { key: "person", label: "You", blurb: "Whose name is on the card and in the signature." },
  { key: "reach", label: "How people reach you", blurb: "Printed exactly as entered — check the spelling." },
  { key: "address", label: "Address", blurb: "Optional. Leave blank to keep a physical address off print." },
  { key: "business", label: "Business & voice", blurb: "Used on invoices, proposals and the guidelines pages." },
];

export function CollateralDetailsDialog({
  open, onOpenChange, snapshotId, onVerified,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshotId: string;
  onVerified?: () => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const q = useQuery({
    queryKey: ["collateralDetails", snapshotId],
    queryFn: () => getCollateralDetails(snapshotId),
    enabled: open && !!snapshotId,
  });

  useEffect(() => {
    if (q.data?.details && !touched) setDraft({ ...q.data.details });
  }, [q.data, touched]);

  useEffect(() => { if (!open) setTouched(false); }, [open]);

  const audit = useMemo(() => auditDetails(draft), [draft]);
  const blocked = Object.keys(audit.blockedKinds);

  const save = useMutation({
    mutationFn: () => saveCollateralDetails(snapshotId, draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collateralDetails", snapshotId] });
      qc.invalidateQueries({ queryKey: ["brandCollateral", snapshotId] });
      toast.success("Details confirmed — collateral will be set from these exact words.");
      onOpenChange(false);
      onVerified?.();
    },
    onError: (e: any) => toast.error(e.message || "Could not save details"),
  });

  const set = (key: string, value: string) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const blur = (key: string) => {
    setDraft((d) => ({ ...d, [key]: normalizeField(key as any, d[key] ?? "") }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-dark-scope flex max-h-[88vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-white/10 p-5">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Confirm your details
          </DialogTitle>
          <DialogDescription>
            These exact words get typeset into your cards, letterhead and templates. We pre-filled what we
            know — correct anything that's wrong before anything goes to a printer.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {q.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />Auditing what we already know…
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                  audit.ready
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                {audit.ready
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                <div>
                  {audit.ready ? (
                    <>
                      Everything required is here.
                      {audit.suspect.length > 0 && ` ${audit.suspect.length} field${audit.suspect.length === 1 ? "" : "s"} worth a second look.`}
                    </>
                  ) : (
                    <>
                      {audit.missingRequired.length} required field
                      {audit.missingRequired.length === 1 ? "" : "s"} still blank — that blocks{" "}
                      {blocked.map((k) => KIND_LABEL[k] ?? k).join(", ")}.
                    </>
                  )}
                </div>
              </div>

              {GROUPS.map((group) => {
                const fields = FIELD_SPECS.filter((f) => f.group === group.key);
                if (!fields.length) return null;
                return (
                  <section key={group.key} className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium">{group.label}</h4>
                      <p className="text-[11px] text-muted-foreground">{group.blurb}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fields.map((f) => {
                        const flag = audit.flags[f.key] ?? { level: "ok" };
                        const bad = flag.level !== "ok";
                        return (
                          <div
                            key={f.key}
                            className={f.multiline || f.key === "address_street" ? "sm:col-span-2" : ""}
                          >
                            <Label htmlFor={`cf-${f.key}`} className="flex items-center gap-1.5 text-xs">
                              {f.label}
                              {f.required && <span className="text-destructive">*</span>}
                              {flag.level === "missing" && <Badge variant="destructive" className="h-4 px-1 text-[9px]">Missing</Badge>}
                              {flag.level === "suspect" && <Badge variant="outline" className="h-4 border-amber-500/50 px-1 text-[9px] text-amber-500">Check</Badge>}
                            </Label>
                            {f.multiline ? (
                              <Textarea
                                id={`cf-${f.key}`}
                                rows={2}
                                value={draft[f.key] ?? ""}
                                placeholder={f.placeholder}
                                onChange={(e) => set(f.key, e.target.value)}
                                onBlur={() => blur(f.key)}
                                className="mt-1 text-sm"
                              />
                            ) : (
                              <Input
                                id={`cf-${f.key}`}
                                value={draft[f.key] ?? ""}
                                placeholder={f.placeholder}
                                onChange={(e) => set(f.key, e.target.value)}
                                onBlur={() => blur(f.key)}
                                className={`mt-1 text-sm ${bad ? "border-amber-500/60" : ""}`}
                              />
                            )}
                            <p className={`mt-1 text-[10px] ${bad ? "text-amber-500" : "text-muted-foreground"}`}>
                              {flag.message ?? f.help}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t border-white/10 bg-background/95 p-4">
          <span className="text-[11px] text-muted-foreground">
            {q.data?.verifiedAt
              ? `Last confirmed ${new Date(q.data.verifiedAt).toLocaleDateString()}`
              : "Not confirmed yet"}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || q.isLoading}>
              {save.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Confirm details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
