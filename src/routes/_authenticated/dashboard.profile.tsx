import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, upsertMyProfile } from "@/lib/attendee.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(upsertMyProfile);
  const { data } = useQuery({ queryKey: ["my", "profile"], queryFn: () => getFn() });

  const [founder, setFounder] = useState({ full_name: "", headline: "", background: "", primary_goal: "" });
  const [business, setBusiness] = useState({ business_name: "", industry: "", stage: "", problem_solved: "", value_prop: "", target_market: "" });
  const [financial, setFinancial] = useState({ current_revenue: "", funding_raised: "", monthly_burn: "", runway_months: "" });

  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setFounder({
      full_name: p.full_name ?? "",
      headline: p.headline ?? "",
      background: p.background ?? "",
      primary_goal: p.primary_goal ?? "",
    });
    setBusiness({
      business_name: p.business_name ?? "",
      industry: p.industry ?? "",
      stage: p.stage ?? "",
      problem_solved: p.problem_solved ?? "",
      value_prop: p.value_prop ?? "",
      target_market: p.target_market ?? "",
    });
    setFinancial({
      current_revenue: p.current_revenue?.toString() ?? "",
      funding_raised: p.funding_raised?.toString() ?? "",
      monthly_burn: p.monthly_burn?.toString() ?? "",
      runway_months: p.runway_months?.toString() ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (vars: { section: "founder" | "business" | "financial" | "complete"; data: Record<string, unknown> }) =>
      saveFn({ data: vars }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["my", "profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile & intake</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The more we know, the more useful your generated deliverables will be.
        </p>
      </div>

      <Section title="Founder">
        <Field label="Full name"><Input value={founder.full_name} onChange={(e) => setFounder({ ...founder, full_name: e.target.value })} /></Field>
        <Field label="Headline"><Input value={founder.headline} onChange={(e) => setFounder({ ...founder, headline: e.target.value })} placeholder="e.g. 10-year ops leader" /></Field>
        <Field label="Background"><Textarea rows={4} value={founder.background} onChange={(e) => setFounder({ ...founder, background: e.target.value })} /></Field>
        <Field label="Primary goal"><Textarea rows={3} value={founder.primary_goal} onChange={(e) => setFounder({ ...founder, primary_goal: e.target.value })} /></Field>
        <Button onClick={() => save.mutate({ section: "founder", data: founder })} disabled={save.isPending}>Save founder</Button>
      </Section>

      <Section title="Startup">
        <Field label="Startup name"><Input value={business.business_name} onChange={(e) => setBusiness({ ...business, business_name: e.target.value })} /></Field>
        <Field label="Industry"><Input value={business.industry} onChange={(e) => setBusiness({ ...business, industry: e.target.value })} /></Field>
        <Field label="Stage"><Input value={business.stage} onChange={(e) => setBusiness({ ...business, stage: e.target.value })} placeholder="idea / mvp / launched" /></Field>
        <Field label="Problem solved"><Textarea rows={3} value={business.problem_solved} onChange={(e) => setBusiness({ ...business, problem_solved: e.target.value })} /></Field>
        <Field label="Value proposition"><Textarea rows={3} value={business.value_prop} onChange={(e) => setBusiness({ ...business, value_prop: e.target.value })} /></Field>
        <Field label="Target market"><Textarea rows={3} value={business.target_market} onChange={(e) => setBusiness({ ...business, target_market: e.target.value })} /></Field>
        <Button onClick={() => save.mutate({ section: "business", data: business })} disabled={save.isPending}>Save startup</Button>
      </Section>

      <Section title="Financial">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current revenue ($)"><Input type="number" value={financial.current_revenue} onChange={(e) => setFinancial({ ...financial, current_revenue: e.target.value })} /></Field>
          <Field label="Funding raised ($)"><Input type="number" value={financial.funding_raised} onChange={(e) => setFinancial({ ...financial, funding_raised: e.target.value })} /></Field>
          <Field label="Monthly burn ($)"><Input type="number" value={financial.monthly_burn} onChange={(e) => setFinancial({ ...financial, monthly_burn: e.target.value })} /></Field>
          <Field label="Runway (months)"><Input type="number" value={financial.runway_months} onChange={(e) => setFinancial({ ...financial, runway_months: e.target.value })} /></Field>
        </div>
        <Button
          onClick={() =>
            save.mutate({
              section: "financial",
              data: {
                current_revenue: financial.current_revenue ? Number(financial.current_revenue) : null,
                funding_raised: financial.funding_raised ? Number(financial.funding_raised) : null,
                monthly_burn: financial.monthly_burn ? Number(financial.monthly_burn) : null,
                runway_months: financial.runway_months ? Number(financial.runway_months) : null,
              },
            })
          }
          disabled={save.isPending}
        >
          Save financial
        </Button>
      </Section>

      <Section title="Finish">
        <p className="text-sm text-muted-foreground">Mark your intake complete once the sections above are filled in.</p>
        <Button onClick={() => save.mutate({ section: "complete", data: {} })} disabled={save.isPending}>
          Mark intake complete
        </Button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
