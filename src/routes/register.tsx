import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { createRegistration } from "@/lib/registrations.functions";
import { listCohorts } from "@/lib/cohorts.functions";
import { EVENT } from "@/lib/schedule-data";
import { getCohortById, getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import { ValueGrid } from "@/components/value/ValueGrid";
import { TotalsBar } from "@/components/value/TotalsBar";
import { PricingTiers } from "@/components/value/PricingTiers";
import { CohortPicker } from "@/components/value/CohortPicker";
import { PRICING, type TierKey } from "@/lib/value-grid";
import { CheckCircle2, ArrowRight, ShieldCheck, Users, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Reserve your seat — Ignite Business Launch Workshop" },
      {
        name: "description",
        content:
          "One day. A formed business, a built website, a printed marketing kit, and a signed 90-day launch plan. From $679 for the first 7 seats.",
      },
      { property: "og:title", content: "Reserve your seat — Ignite Business Launch Workshop" },
      {
        property: "og:description",
        content: "Walk in with an idea. Walk out with a business. From $679.",
      },
    ],
  }),
  component: RegisterPage,
});

const FormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  business_idea: z
    .string()
    .trim()
    .min(10, "A sentence or two helps us tailor the day")
    .max(2000),
  industry: z.string().trim().min(1, "Pick an industry"),
  stage: z.enum(["idea", "early", "existing"]),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
  tier_interest: z.enum(["founders", "cohort"]),
  cohort_id: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a cohort date"),
});

type FormValues = z.infer<typeof FormSchema>;

function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tier, setTier] = useState<TierKey>("founders");
  const fetchCohorts = useServerFn(listCohorts);
  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: () => fetchCohorts(),
    initialData: [],
    staleTime: 60_000,
  });
  const defaultCohort = useMemo(
    () => getNextAvailable(cohorts) ?? FALLBACK_COHORT,
    [cohorts],
  );
  const [cohortId, setCohortId] = useState<string>(defaultCohort.id);
  const submit = useServerFn(createRegistration);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      stage: "idea",
      industry: "",
      tier_interest: "founders",
      cohort_id: defaultCohort.id,
    },
  });

  // Once cohorts hydrate, sync the form's hidden field if the user hasn't picked yet.
  if (cohortId === FALLBACK_COHORT.id && defaultCohort.id !== FALLBACK_COHORT.id) {
    setCohortId(defaultCohort.id);
    setValue("cohort_id", defaultCohort.id, { shouldValidate: false });
  }

  const selectTier = (t: TierKey) => {
    setTier(t);
    setValue("tier_interest", t, { shouldValidate: true });
  };

  const selectCohort = (id: string) => {
    setCohortId(id);
    setValue("cohort_id", id, { shouldValidate: true });
  };

  const selectedCohort = getCohortById(cohorts, cohortId) ?? defaultCohort;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await submit({ data: values });
      setSubmitted(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-white/5 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Monthly cohorts · IGNITE Center at Greater Atlanta Christian School, Norcross GA
          </p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            Walk in with an idea.{" "}
            <span className="text-gradient-brand">Walk out with a business.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            One 8-hour build day. 25 finished deliverables. A formed business, a built website,
            a printed marketing kit, and a signed 90-day launch plan — all done in the room.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Users className="size-4" /> 20 seats per cohort
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" /> {EVENT.timeLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" /> Founder-led, build-as-you-go
            </span>
          </div>

          {/* Cohort picker — compact, sits in the hero */}
          <div className="mt-8">
            <CohortPicker cohorts={cohorts} selectedId={cohortId} onSelect={selectCohort} />
          </div>
        </div>
      </section>

      {/* Value Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              What you actually walk out with
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Every deliverable. <span className="text-muted-foreground">What it would cost. What it would take.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conservative market rates and DIY hours, deliverable by deliverable. No fluff.
            </p>
          </div>
          <ValueGrid />
          <div className="mt-8">
            <TotalsBar />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-white/5 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Pick your seat
            </p>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              From <span className="text-gradient-brand">${PRICING.founders.price}</span>.
              All 25 deliverables included.
            </h2>
          </div>
          <PricingTiers selected={tier} onSelect={selectTier} scrollTargetId="register-form" />
        </div>
      </section>

      {/* Form */}
      <section className="py-16" id="register-form">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Reserve your seat
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tell us a bit about your idea so we can tailor the day to your cohort.
            </p>
          </div>
          {submitted ? (
            <SuccessCard tier={tier} cohort={selectedCohort} />
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
              <Field label="What business do you want to start?" error={errors.business_idea?.message}>
                <textarea
                  {...register("business_idea")}
                  rows={4}
                  className="input resize-y"
                  placeholder="One or two sentences. Who is it for, what does it do?"
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
                      <option key={o} value={o}>{o}</option>
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

              <Field label="Seat tier" error={errors.tier_interest?.message}>
                <div className="grid gap-3 md:grid-cols-2">
                  {(["founders", "cohort"] as const).map((t) => {
                    const p = PRICING[t];
                    const isOn = tier === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => selectTier(t)}
                        className={`text-left rounded-xl border p-4 transition ${
                          isOn
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-medium">{p.label}</span>
                          <span className="tabular-nums font-semibold">${p.price}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{p.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register("tier_interest")} />
                <input type="hidden" {...register("cohort_id")} />
              </Field>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Cohort
                </div>
                <div className="mt-0.5 font-medium text-foreground">
                  Reserving for {selectedCohort.dateLabel}
                </div>
              </div>

              <Field label="How did you hear about us? (optional)" error={errors.referral_source?.message}>
                <input {...register("referral_source")} className="input" placeholder="Friend, Instagram, search…" />
              </Field>

              {serverError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Reserving…" : `Reserve my ${PRICING[tier].label} — $${PRICING[tier].price}`}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                We&apos;ll follow up with confirmation, payment instructions, and what to bring.
              </p>
            </form>
          )}
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function SuccessCard({ tier, cohort }: { tier: TierKey; cohort: Cohort }) {
  const bring = [
    "Your laptop and charger",
    "Headphones (optional)",
    "Any existing brand assets / domain ideas",
    "An open mind and your business idea",
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-hero-gradient">
        <CheckCircle2 className="size-6 text-white" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">You&apos;re in.</h2>
      <p className="mt-2 text-muted-foreground">
        {PRICING[tier].label} reserved for {cohort.dateLabel} in {cohort.cityLabel}. Check your email for confirmation and payment instructions shortly.
      </p>
      <div className="mt-8 rounded-xl border border-white/10 p-5 text-left">
        <div className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          What to bring
        </div>
        <ul className="space-y-2">
          {bring.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/schedule"
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
        >
          See the schedule
        </Link>
        <a
          href={cohort.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Get directions
        </a>
      </div>
    </div>
  );
}
