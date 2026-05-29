import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBrief } from "@/lib/brief.functions";
import { getMyFiling } from "@/lib/filing.functions";
import { getMyWorkflow } from "@/lib/userPipeline.functions";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const briefFn = useServerFn(getMyBrief);
  const filingFn = useServerFn(getMyFiling);
  const wfFn = useServerFn(getMyWorkflow);
  const brief = useQuery({ queryKey: ["my", "brief"], queryFn: () => briefFn() });
  const filing = useQuery({ queryKey: ["my", "filing"], queryFn: () => filingFn() });
  const wf = useQuery({ queryKey: ["my", "workflow"], queryFn: () => wfFn() });

  const briefScore = brief.data?.brief?.completeness_score ?? 0;
  const briefReady = briefScore >= 6;
  const filingReady = !!filing.data?.filing?.llc_name;
  const items = wf.data?.items ?? [];
  const generated = items.filter((i) => i.generated).length;
  const total = items.length;

  const nextStep = !briefReady
    ? { to: "/dashboard/brief" as const, label: "Finish your Business Brief", hint: `${briefScore} / 10 fields complete` }
    : !filingReady
      ? { to: "/dashboard/filing" as const, label: "Add filing details", hint: "Needed for legal deliverables" }
      : { to: "/dashboard/workflow" as const, label: "Open your workflow", hint: `${generated} / ${total} deliverables generated` };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI builds your 25 deliverables from the info you provide. Each step unlocks the next.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Business Brief" value={briefReady ? "Complete" : `${briefScore} / 10`} to="/dashboard/brief" />
        <Card label="Filing Info" value={filingReady ? "On file" : "Pending"} to="/dashboard/filing" />
        <Card label="Deliverables" value={`${generated} / ${total}`} to="/dashboard/workflow" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-medium">Next step</h2>
        <p className="mt-1 text-sm text-muted-foreground">{nextStep.hint}</p>
        <Link
          to={nextStep.to}
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {nextStep.label}
        </Link>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  to,
}: {
  label: string;
  value: string;
  to: "/dashboard/brief" | "/dashboard/filing" | "/dashboard/workflow";
}) {
  return (
    <Link to={to} className="rounded-2xl border border-white/10 bg-card p-5 hover:border-white/20">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </Link>
  );
}
