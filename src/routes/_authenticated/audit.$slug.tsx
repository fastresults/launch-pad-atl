import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getWorkshopAudit } from "@/lib/workshop-audit";
import { getWorkshopPains } from "@/lib/workshop-pains";
import { getCatalogWorkshop } from "@/lib/workshop-catalog";
import {
  getMyAudit,
  getMyIntake,
  saveMyIntake,
} from "@/lib/workshop-audits.functions";

/**
 * The attendee side of the pre-workshop audit: submit the real material for
 * your lane, then read the graded audit once it has been reviewed and sent.
 */
export default function WorkshopAuditPage() {
  const { slug = "" } = useParams();
  const qc = useQueryClient();
  const spec = getWorkshopAudit(slug);
  const workshop = getCatalogWorkshop(slug);
  const pains = getWorkshopPains(slug);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const intakeQ = useQuery({
    queryKey: ["my_audit_intake", slug],
    queryFn: () => getMyIntake(slug),
    enabled: Boolean(spec),
  });
  const auditQ = useQuery({
    queryKey: ["my_audit", slug],
    queryFn: () => getMyAudit(slug),
    enabled: Boolean(spec),
  });

  useEffect(() => {
    if (intakeQ.data?.answers) setAnswers(intakeQ.data.answers);
  }, [intakeQ.data]);

  const saveM = useMutation({
    mutationFn: (submit: boolean) => saveMyIntake({ slug, answers, submit }),
    onSuccess: (_row, submit) => {
      toast.success(submit ? "Submitted — your audit is being prepared." : "Saved.");
      qc.invalidateQueries({ queryKey: ["my_audit_intake", slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const missingRequired = useMemo(
    () =>
      (spec?.intake ?? []).filter(
        (f) => f.required && !(answers[f.key] ?? "").trim() && f.kind !== "files",
      ),
    [spec, answers],
  );

  if (!spec) return <Navigate to="/dashboard" replace />;

  const audit = auditQ.data;
  const submitted = Boolean(intakeQ.data?.submitted_at);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {workshop.title} · Pre-workshop
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{spec.name}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{spec.promise}</p>

      {audit?.status === "sent" && audit.report ? (
        <section className="mt-8 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Overall grade
              </p>
              <Badge variant="secondary" className="text-base">
                {audit.report.overallGrade ?? audit.overall_grade ?? "—"}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{audit.report.summary}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              What your morning builds
            </p>
            <p className="mt-2 text-base font-medium leading-snug">
              {audit.report.prescribedOutcome ?? audit.prescribed_outcome}
            </p>
          </div>

          {(audit.report.items ?? []).map((item, i) => {
            const pain = pains.find((p) => p.id === item.painId);
            return (
              <div key={item.painId || i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-medium">
                    {String(i + 1).padStart(2, "0")} · {pain?.pain ?? item.painId}
                  </h2>
                  <Badge variant="outline">{item.grade}</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{item.finding}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Cost of leaving it: {item.cost}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  In the room: {item.inTheRoom}
                </p>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="mt-8 space-y-5">
          {submitted && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Submitted. Your graded audit arrives 48 hours before your session — you
              can keep editing your answers until then.
            </div>
          )}

          {spec.intake.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium" htmlFor={field.key}>
                {field.label}
                {field.required && <span className="ml-1 text-muted-foreground">·  required</span>}
              </label>
              <p className="mb-2 mt-1 text-xs text-muted-foreground">{field.help}</p>
              {field.kind === "longtext" || field.kind === "files" ? (
                <Textarea
                  id={field.key}
                  rows={4}
                  value={answers[field.key] ?? ""}
                  placeholder={field.kind === "files" ? "Paste links to the files" : undefined}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [field.key]: e.target.value }))
                  }
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.kind === "url" ? "url" : "text"}
                  value={answers[field.key] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [field.key]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => saveM.mutate(true)}
              disabled={saveM.isPending || missingRequired.length > 0}
            >
              {submitted ? "Update my submission" : "Submit for my audit"}
            </Button>
            <Button
              variant="outline"
              onClick={() => saveM.mutate(false)}
              disabled={saveM.isPending}
            >
              Save for later
            </Button>
            {missingRequired.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Still needed: {missingRequired.map((f) => f.label).join(", ")}
              </span>
            )}
          </div>
        </section>
      )}

      <Link
        to="/dashboard"
        className="mt-10 inline-block text-sm text-muted-foreground underline"
      >
        Back to your dashboard
      </Link>
    </div>
  );
}
