import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, listMyDeliverables, listMyDocuments, listMyGoals } from "@/lib/attendee.functions";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const profileFn = useServerFn(getMyProfile);
  const docsFn = useServerFn(listMyDocuments);
  const goalsFn = useServerFn(listMyGoals);
  const delFn = useServerFn(listMyDeliverables);
  const profile = useQuery({ queryKey: ["my", "profile"], queryFn: () => profileFn() });
  const docs = useQuery({ queryKey: ["my", "documents"], queryFn: () => docsFn() });
  const goals = useQuery({ queryKey: ["my", "goals"], queryFn: () => goalsFn() });
  const deliverables = useQuery({ queryKey: ["my", "deliverables"], queryFn: () => delFn() });

  const intakeDone = !!profile.data?.profile?.intake_completed_at;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workshop portal. Complete intake so we can prepare your deliverables.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Intake" value={intakeDone ? "Complete" : "In progress"} to="/dashboard/profile" />
        <Card label="Documents" value={String(docs.data?.documents.length ?? 0)} to="/dashboard/documents" />
        <Card label="Goals" value={String(goals.data?.goals.length ?? 0)} to="/dashboard/goals" />
        <Card label="Deliverables" value={String(deliverables.data?.deliverables.length ?? 0)} to="/dashboard/deliverables" />
      </div>

      {!intakeDone && (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-medium">Start your intake</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us about you and your business so our team can prepare personalized materials.
          </p>
          <Link
            to="/dashboard/profile"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Begin intake
          </Link>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, to }: { label: string; value: string; to: "/dashboard/profile" | "/dashboard/documents" | "/dashboard/goals" | "/dashboard/deliverables" }) {
  return (
    <Link to={to} className="rounded-2xl border border-white/10 bg-card p-5 hover:border-white/20">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </Link>
  );
}
