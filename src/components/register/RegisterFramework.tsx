// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { createRegistration } from "@/lib/registrations.functions";
import { listCohorts } from "@/lib/cohorts.functions";
import { getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import {
  FRAMEWORK_STAGES,
  TOTAL_DELIVERABLES,
  WORKSHOP_PRICE_CENTS,
  WORKSHOP_PRICE_LABEL,
} from "@/lib/framework-deliverables";
import { getBuildWorkshop } from "@/lib/build-workshops";
import { ArrowRight, Check, CheckCircle2, Sparkles, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  business_idea: z
    .string()
    .trim()
    .min(20, "A sentence or two helps us tailor the session")
    .max(2000),
  industry: z.string().trim().min(1, "Pick an industry"),
  stage: z.enum(["idea", "early", "existing"]),
  cohort_id: z.string().trim().min(1, "Pick a date"),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof FormSchema>;

export function RegisterFramework() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Context: which workshop is the user registering for?
  const [params] = useSearchParams();
  const workshopSlug = params.get("workshop");
  const preselectedDateIso = params.get("date");
  const buildWorkshop = workshopSlug ? getBuildWorkshop(workshopSlug) : undefined;

  const ctx = buildWorkshop
    ? {
        eyebrow: `${buildWorkshop.title} · ${buildWorkshop.priceLabel}`,
        heroTitleLead: buildWorkshop.oneLiner,
        heroTitleEmphasis: null as string | null,
        heroBlurb: buildWorkshop.subhead,
        asideBlurb: `${buildWorkshop.title} — small cohort, working session with the facilitator. Live online. Coffee optional.`,
        walkOuts: buildWorkshop.walkOuts as string[] | null,
        priceLabel: buildWorkshop.priceLabel,
        priceCents: 19_700,
        footerLine: `${buildWorkshop.walkOuts.length} deliverables · built live with the facilitator · yours to keep.`,
      }
    : {
        eyebrow: `The 14-Day Pivot Method · ${WORKSHOP_PRICE_LABEL} · Norcross, GA`,
        heroTitleLead: "Reserve your seat inside",
        heroTitleEmphasis: `The 14-Day Pivot Method.`,
        heroBlurb: "The done-with-you method replacing accelerators, courses, and raw AI. One morning with the facilitator — offer priced, first customer named, outreach going out that afternoon. Fourteen days to first revenue. Coffee and refreshments on us.",
        asideBlurb: "One live morning inside The 14-Day Pivot Method — small cohort, real startup built. Not another course. Not raw AI. The done-with-you method replacing both.",
        walkOuts: null as string[] | null,
        priceLabel: WORKSHOP_PRICE_LABEL,
        priceCents: WORKSHOP_PRICE_CENTS,
        footerLine: `Everything you need to be selling by Monday · built with Adam · yours to keep.`,
      };

  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: () => listCohorts(),
    initialData: [],
    staleTime: 60_000,
  });
  const openCohorts = useMemo(
    () => cohorts.filter((c) => c.status !== "sold_out"),
    [cohorts],
  );
  const defaultCohort = useMemo(() => {
    if (preselectedDateIso) {
      const match = openCohorts.find((c) => c.startISO === preselectedDateIso);
      if (match) return match;
    }
    return getNextAvailable(openCohorts) ?? FALLBACK_COHORT;
  }, [openCohorts, preselectedDateIso]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { stage: "idea", industry: "", cohort_id: defaultCohort.id },
  });

  // Keep cohort_id in sync once cohorts load or preselected date resolves.
  useEffect(() => {
    setValue("cohort_id", defaultCohort.id);
  }, [defaultCohort.id, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createRegistration({
        ...values,
        tier_interest: "cohort",
        assigned_tier: "cohort",
        price_paid_cents: ctx.priceCents,
      });
      setSubmitted(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-white/5 py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            <Sparkles className="size-3.5" /> {ctx.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {ctx.heroTitleEmphasis ? (
              <>
                {ctx.heroTitleLead}{" "}
                <span className="text-gradient-brand">{ctx.heroTitleEmphasis}</span>
              </>
            ) : (
              <span className="text-gradient-brand">{ctx.heroTitleLead}</span>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:mt-5 md:text-lg">
            {ctx.heroBlurb}
          </p>

        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.2fr_1fr]">
          {submitted ? (
            <SuccessCard />
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 md:p-8"
            >
              <Field label="Full name" error={errors.name?.message}>
                <input {...register("name")} className="input" placeholder="Your name" autoComplete="name" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register("email")}
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone (optional)" error={errors.phone?.message}>
                <input {...register("phone")} className="input" placeholder="+1 (404) 555-0123" autoComplete="tel" />
              </Field>

              <Field
                label="What's the startup?"
                hint="One or two sentences — what it is, who it's for, where you are with it today."
                error={errors.business_idea?.message}
              >
                <textarea
                  {...register("business_idea")}
                  rows={4}
                  className="input resize-y"
                  placeholder="The idea and where you are with it."
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Industry" error={errors.industry?.message}>
                  <select {...register("industry")} className="input">
                    <option value="">Select…</option>
                    {[
                      "Services / Consulting",
                      "E-commerce / Retail",
                      "Software / SaaS",
                      "Food & Beverage",
                      "Health & Wellness",
                      "Creative / Media",
                      "Education",
                      "Real estate",
                      "Other",
                    ].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Where are you today?" error={errors.stage?.message}>
                  <select {...register("stage")} className="input">
                    <option value="idea">Just an idea</option>
                    <option value="early">Early — testing it</option>
                    <option value="existing">Existing business</option>
                  </select>
                </Field>
              </div>

              <Field label="Pick a date" error={errors.cohort_id?.message}>
                <select {...register("cohort_id")} className="input">
                  {openCohorts.length === 0 && (
                    <option value={FALLBACK_COHORT.id}>{FALLBACK_COHORT.dateLabel}</option>
                  )}
                  {openCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.dateLabel} · {c.cityLabel}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="How did you hear about us? (optional)" error={errors.referral_source?.message}>
                <input
                  {...register("referral_source")}
                  className="input"
                  placeholder="Friend, search, social…"
                />
              </Field>

              {serverError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Reserving…" : `Reserve seat — ${ctx.priceLabel}`}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                We'll email payment instructions and your session details.
              </p>
            </form>
          )}

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-card p-6 md:p-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tabular-nums md:text-5xl">{ctx.priceLabel}</span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {ctx.asideBlurb}
              </p>

              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                What you walk out with
              </div>
              {ctx.walkOuts ? (
                <ul className="mt-3 space-y-3 text-sm">
                  {ctx.walkOuts.map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="font-medium leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <TooltipProvider delayDuration={150}>
                  <ul className="mt-3 space-y-3 text-sm">
                    {FRAMEWORK_STAGES.map((stage) => (
                      <Tooltip key={stage.number}>
                        <TooltipTrigger asChild>
                          <li className="flex gap-3 cursor-help rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-white/[0.03]">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2 font-medium">
                                <span>Stage {Number(stage.number)} · {stage.items.length} startup assets</span>
                                {stage.bonus && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-gradient-to-r from-primary/20 to-primary/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white">
                                    <Sparkles className="size-2.5" /> Bonus
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{stage.name}</div>
                            </div>
                          </li>
                        </TooltipTrigger>
                        {stage.benefit && (
                          <TooltipContent side="left" className="max-w-xs text-sm leading-snug">
                            {stage.benefit}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </ul>
                </TooltipProvider>
              )}
              <div className="mt-3 text-xs text-muted-foreground">
                {ctx.footerLine}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" />
                <span>Need execution help? See <Link to="/services" className="text-foreground underline-offset-4 hover:underline">our services</Link>.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 0.7rem 0.9rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color .15s, background .15s;
        }
        .input:focus { border-color: var(--color-ring); background: rgba(255,255,255,0.06); }
        .input::placeholder { color: var(--color-muted-foreground); }
        select.input option { background: #1a1a2a; color: white; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="mb-1.5 block text-xs text-muted-foreground">{hint}</span>}
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function SuccessCard() {
  return (
    <div className="md:col-span-2 rounded-2xl border border-white/10 bg-card p-8 text-center">
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-hero-gradient">
        <CheckCircle2 className="size-6 text-white" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">Reserved. Check your inbox.</h2>
      <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
        We'll email payment instructions and a confirmation with the session details. If you don't see it in 10 minutes, check spam or contact us.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
        >
          Back to home
        </Link>
        <Link
          to="/services"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-hero-gradient px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          See our services
        </Link>
      </div>
    </div>
  );
}
