import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getApplication,
  updateApplicationStatus,
  addApplicationNote,
  promoteApplicationToRegistration,
  type ApplicationStatus,
} from "@/lib/applications-admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Copy, Mail, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/admin/applications/$id")({
  component: ApplicationDetailPage,
  head: () => ({ meta: [{ title: "Application — Admin" }] }),
});

const STATUSES: ApplicationStatus[] = [
  "applied",
  "reviewing",
  "shortlisted",
  "selected",
  "waitlisted",
  "rejected",
  "withdrawn",
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  reviewing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  shortlisted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  selected: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  waitlisted: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  withdrawn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied");
}

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getFn = useServerFn(getApplication);
  const updateFn = useServerFn(updateApplicationStatus);
  const addNoteFn = useServerFn(addApplicationNote);
  const promoteFn = useServerFn(promoteApplicationToRegistration);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "application", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "application", id] });
    qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    qc.invalidateQueries({ queryKey: ["admin", "badges"] });
  };

  const statusMut = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      updateFn({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const promoteMut = useMutation({
    mutationFn: () => promoteFn({ data: { id } }),
    onSuccess: (res) => {
      toast.success("Created registration");
      invalidate();
      void res;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [noteBody, setNoteBody] = useState("");
  const noteMut = useMutation({
    mutationFn: (body: string) =>
      addNoteFn({ data: { applicationId: id, body } }),
    onSuccess: () => {
      setNoteBody("");
      toast.success("Note added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const a = data.application;
  const notes = data.notes;
  const reg = data.registration;
  const status = a.status as ApplicationStatus;

  const firstName = (a.name || "").trim().split(/\s+/)[0] || "there";
  const mailtoSubject = encodeURIComponent(
    `Re: Your Launch Pad ATL application`,
  );
  const mailtoBody = encodeURIComponent(
    `Hi ${firstName},\n\nThanks again for applying to the July 23, 2026 Atlanta selection cohort. `,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/applications" })}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> All applications
        </Button>
        <a
          href={`mailto:${a.email}?subject=${mailtoSubject}&body=${mailtoBody}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Mail className="h-4 w-4" /> Reply by email
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: full record */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <button
                    onClick={() => copy(a.email)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {a.email} <Copy className="h-3 w-3" />
                  </button>
                  {a.phone && (
                    <button
                      onClick={() => copy(a.phone!)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {a.phone} <Copy className="h-3 w-3" />
                    </button>
                  )}
                  {a.linkedin_url && (
                    <a
                      href={a.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("border text-xs", STATUS_TONE[status])}
              >
                {status}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
              <Field label="Industry" value={a.industry} />
              <Field label="Stage" value={a.stage} />
              <Field label="Cohort" value={a.cohort_id ?? "—"} />
              <Field
                label="Applied"
                value={new Date(a.created_at).toLocaleString()}
              />
              {a.referral_source && (
                <Field label="Referral" value={a.referral_source} />
              )}
              <Field label="Can attend" value={a.can_attend ? "Yes" : "No"} />
            </div>
          </div>

          <Section title="About the founder" body={a.about_you} />
          <Section title="About the startup" body={a.about_startup} />
          <Section title="Why this, why now" body={a.why_now} />
        </div>

        {/* Right: actions */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </h2>
            <div className="mt-3 space-y-2">
              <Select
                value={status}
                onValueChange={(v) => {
                  const next = v as ApplicationStatus;
                  if (next === "rejected" || next === "selected") return;
                  statusMut.mutate(next);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <ConfirmAction
                  label="Mark selected"
                  description="This applicant has been chosen. You'll then promote them into a confirmed registration."
                  onConfirm={() => statusMut.mutate("selected")}
                  disabled={status === "selected" || statusMut.isPending}
                  tone="ok"
                />
                <ConfirmAction
                  label="Reject"
                  description="Reject this application. They will not be selected for the cohort."
                  onConfirm={() => statusMut.mutate("rejected")}
                  disabled={status === "rejected" || statusMut.isPending}
                  tone="danger"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Promote to registration
            </h2>
            {reg ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="inline-flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Already registered ({reg.status})
                </div>
                <Link
                  to="/admin/registrations"
                  className="block text-xs text-muted-foreground underline"
                >
                  View in Registrations →
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  Enabled once status is <strong>selected</strong>. Creates a
                  confirmed row in Registrations.
                </p>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  disabled={status !== "selected" || promoteMut.isPending}
                  onClick={() => promoteMut.mutate()}
                >
                  Promote to registration
                </Button>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </h2>
            <Textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Add an internal note…"
              rows={3}
              className="mt-2 text-sm"
            />
            <Button
              size="sm"
              className="mt-2"
              disabled={!noteBody.trim() || noteMut.isPending}
              onClick={() => noteMut.mutate(noteBody.trim())}
            >
              Add note
            </Button>

            <div className="mt-4 space-y-3">
              {notes.length === 0 && (
                <p className="text-xs text-muted-foreground">No notes yet.</p>
              )}
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-lg border border-white/5 p-3 text-xs",
                    n.kind === "system"
                      ? "bg-white/[0.02] text-muted-foreground italic"
                      : "bg-white/[0.04]",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                    <span>{n.author_name || "Admin"}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{body}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}

function ConfirmAction({
  label,
  description,
  onConfirm,
  disabled,
  tone,
}: {
  label: string;
  description: string;
  onConfirm: () => void;
  disabled?: boolean;
  tone: "ok" | "danger";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={tone === "ok" ? "default" : "destructive"}
          disabled={disabled}
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
