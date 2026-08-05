import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  generateAudit,
  listAudits,
  listIntakes,
  sendAudit,
  updateAudit,
  type AuditIntakeRow,
  type AuditRow,
} from "@/lib/workshop-audits.functions";
import { getCatalogWorkshop } from "@/lib/workshop-catalog";
import { getWorkshopPains } from "@/lib/workshop-pains";

/** Review desk for the pre-workshop audits. Nothing reaches an attendee unread. */
export default function AdminAuditsPage() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const intakesQ = useQuery({ queryKey: ["admin_audit_intakes"], queryFn: listIntakes });
  const auditsQ = useQuery({ queryKey: ["admin_audits"], queryFn: listAudits });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin_audits"] });
    qc.invalidateQueries({ queryKey: ["admin_audit_intakes"] });
  };

  const latestByIntake = useMemo(() => {
    const map = new Map<string, AuditRow>();
    for (const a of auditsQ.data ?? []) {
      if (a.intake_id && !map.has(a.intake_id)) map.set(a.intake_id, a);
    }
    return map;
  }, [auditsQ.data]);

  const generateM = useMutation({
    mutationFn: (intake: AuditIntakeRow) => generateAudit(intake),
    onSuccess: () => {
      toast.success("Audit generated — review it before sending.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendM = useMutation({
    mutationFn: (id: string) => sendAudit(id),
    onSuccess: () => {
      toast.success("Audit released to the attendee.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const notesM = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updateAudit(id, { admin_notes: notes }),
    onSuccess: () => {
      toast.success("Notes saved.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const intakes = intakesQ.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop audits"
        description="Every build workshop opens with a graded audit of the attendee's own work. Generate it, read it, then release it 48 hours before the session."
      />

      {intakesQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!intakesQ.isLoading && intakes.length === 0 && (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      )}

      <div className="space-y-4">
        {intakes.map((intake) => {
          const audit = latestByIntake.get(intake.id);
          const workshop = getCatalogWorkshop(intake.workshop_slug);
          const pains = getWorkshopPains(intake.workshop_slug);
          const open = openId === intake.id;

          return (
            <div key={intake.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{workshop.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Attendee {intake.user_id.slice(0, 8)} ·{" "}
                    {intake.submitted_at
                      ? `submitted ${new Date(intake.submitted_at).toLocaleDateString()}`
                      : "draft, not submitted"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={audit?.status === "sent" ? "default" : "secondary"}>
                    {audit?.status ?? "no audit"}
                  </Badge>
                  {audit?.overall_grade && (
                    <Badge variant="outline">Grade {audit.overall_grade}</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateM.mutate(intake)}
                    disabled={generateM.isPending}
                  >
                    {audit ? "Regenerate" : "Generate audit"}
                  </Button>
                  {audit && audit.status !== "sent" && (
                    <Button
                      size="sm"
                      onClick={() => sendM.mutate(audit.id)}
                      disabled={sendM.isPending}
                    >
                      Approve &amp; send
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(open ? null : intake.id)}>
                    {open ? "Hide" : "Review"}
                  </Button>
                </div>
              </div>

              {open && (
                <div className="mt-5 space-y-5 border-t border-border pt-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      What they submitted
                    </p>
                    <dl className="mt-2 space-y-2 text-sm">
                      {Object.entries(intake.answers ?? {}).map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs text-muted-foreground">{k}</dt>
                          <dd className="whitespace-pre-wrap">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {audit?.report && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Summary
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{audit.report.summary}</p>
                        <p className="mt-3 text-sm font-medium">
                          Prescribed outcome: {audit.report.prescribedOutcome}
                        </p>
                      </div>
                      {(audit.report.items ?? []).map((item, i) => {
                        const pain = pains.find((p) => p.id === item.painId);
                        return (
                          <div key={item.painId || i} className="rounded-lg border border-border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium">
                                {String(i + 1).padStart(2, "0")} · {pain?.pain ?? item.painId}
                              </p>
                              <Badge variant="outline">{item.grade}</Badge>
                            </div>
                            <p className="mt-2 text-sm">{item.finding}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Cost: {item.cost}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              In the room: {item.inTheRoom}
                            </p>
                          </div>
                        );
                      })}
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Reviewer notes
                        </p>
                        <Textarea
                          rows={3}
                          defaultValue={audit.admin_notes ?? ""}
                          onBlur={(e) =>
                            e.target.value !== (audit.admin_notes ?? "") &&
                            notesM.mutate({ id: audit.id, notes: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
