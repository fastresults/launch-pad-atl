import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOpsRunway, requestEngagement, type OpsAuth } from "@/lib/ops.functions";
import {
  ENGAGE_COPY, ENGAGE_INCLUDES, ENGAGE_NOT_INCLUDED, ENGAGE_STEPS,
  RETAINER_DAYS, RETAINER_MONTHLY, RETAINER_MONTHS, RETAINER_TOTAL, money,
} from "@/lib/ops-engagement";
import { FOUNDATION_DELIVERED } from "@/lib/ops-runway";
import { EngageCoverage } from "@/components/ops/engage/EngageCoverage";
import { EngageIntakeDialog } from "@/components/ops/engage/EngageIntakeDialog";
import { OpsStageArt } from "@/components/ops/OpsStageArt";
import { useDocumentTitle } from "@/lib/use-document-title";

const PHONE = "929-234-7355";

/**
 * Public engagement page for a share link: the price, exactly what the retainer
 * covers on this venture's own runway, and one way to start. No login.
 */
export default function VentureEngagePage() {
  const { token = "" } = useParams();
  const [open, setOpen] = useState(false);
  const auth: OpsAuth = { kind: "share", token };

  const q = useQuery({
    queryKey: ["venture-ops-engage", token],
    queryFn: () => fetchOpsRunway(auth),
    retry: false,
  });

  const venture = q.data?.ventureName ?? null;
  useDocumentTitle(
    venture ? `Startup Labs builds it — ${venture}` : "Startup Labs builds it",
  );

  return (
    <div className="theme-dark-scope min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to={`/v/${token}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to your venture
        </Link>

        <header className="relative mt-5 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.09] via-card/40 to-card/10 p-6 sm:p-9">
          <OpsStageArt phase={2} className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-[0.08]" />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {ENGAGE_COPY.eyebrow}
            </p>
            <h1 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-[40px]">
              {ENGAGE_COPY.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {ENGAGE_COPY.lede}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <div className="font-serif text-4xl text-foreground sm:text-5xl">
                  {money(RETAINER_MONTHLY)}
                  <span className="ml-1 align-baseline text-base text-muted-foreground">/month</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {RETAINER_MONTHS}-month term · {money(RETAINER_TOTAL)} total · {RETAINER_DAYS}-day build window
                </p>
              </div>
              <p className="max-w-xs text-xs text-muted-foreground">{ENGAGE_COPY.termNote}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="h-12 px-6" onClick={() => setOpen(true)}>
                {ENGAGE_COPY.primaryCta} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <a href={`tel:+1${PHONE.replace(/\D/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> {PHONE}
                </a>
              </Button>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> No payment today. The kickoff call comes first.
            </p>
          </div>
        </header>

        <section className="mt-4 rounded-2xl border border-border/50 bg-card/30 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Phase 2 of 2 · Foundation complete
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You already own the work below. Nothing here recreates it — the retainer puts it into the world.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FOUNDATION_DELIVERED.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                <Check className="h-3 w-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
            <h2 className="font-serif text-xl text-foreground">What the retainer covers</h2>
            <ul className="mt-4 space-y-3">
              {ENGAGE_INCLUDES.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted-foreground">
              {ENGAGE_NOT_INCLUDED}
            </p>
          </section>

          <div className="space-y-4">
            {q.isLoading && (
              <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/40 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your runway…
              </div>
            )}
            {q.isError && (
              <div className="rounded-2xl border border-dashed border-border/50 p-6 text-sm text-muted-foreground">
                We couldn't read your runway from here.{" "}
                <Link to={`/v/${token}`} className="text-primary underline">Open your venture</Link> and try again —
                the price and terms above still apply.
              </div>
            )}
            {q.data && <EngageCoverage tasks={q.data.tasks} />}

            <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
              <h2 className="font-serif text-xl text-foreground">How it starts</h2>
              <ol className="mt-4 space-y-4">
                {ENGAGE_STEPS.map((s, i) => (
                  <li key={s.label} className="flex gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.label}</div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button className="mt-5 h-11 w-full" onClick={() => setOpen(true)}>
                {ENGAGE_COPY.primaryCta}
              </Button>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prefer to keep building it yourself? Your runway stays exactly where it is —{" "}
          <Link to={`/v/${token}`} className="text-primary underline">go back to it</Link>.
        </p>
      </div>

      <EngageIntakeDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={async (input) => { await requestEngagement(auth, input); }}
      />
    </div>
  );
}
