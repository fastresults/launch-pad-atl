import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { createRegistration } from "@/lib/registrations.functions";
import { listCohorts } from "@/lib/cohorts.functions";
import { getCohortAvailability } from "@/lib/cohort-availability.functions";
import { EVENT } from "@/lib/schedule-data";
import {
  getCohortById,
  getNextAvailable,
  FALLBACK_COHORT,
  formatPriceCents,
  toPublicSeats,
  toPublicTaken,
  type Cohort,
} from "@/lib/cohorts";
import { ValueGrid } from "@/components/value/ValueGrid";
import { TotalsBar } from "@/components/value/TotalsBar";
import { PricingTiers } from "@/components/value/PricingTiers";
import { CohortPicker } from "@/components/value/CohortPicker";
import { type TierKey } from "@/lib/value-grid";
import { CheckCircle2, ArrowRight, ShieldCheck, Users, CalendarDays, Lock } from "lucide-react";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import { RegisterSelection } from "@/components/register/RegisterSelection";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Reserve your seat — Ignite Business Launch Workshop" },
      {
        name: "description",
        content:
          "One day. A formed business, a built website, a printed marketing kit, and a signed 90-day launch plan.",
      },
      { property: "og:title", content: "Reserve your seat — Ignite Business Launch Workshop" },
      {
        property: "og:description",
        content: "Walk in with an idea. Walk out with a business.",
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
  const fetchSettings = useServerFn(getPublicSiteSettings);
  const { data: siteSettings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });
  if (isLoading) return null;
  if (siteSettings?.register_variant === "selection") return <RegisterSelection />;
  return <RegisterDefault />;
}

function RegisterDefault() {
  const [submitted, setSubmitted] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [tier, setTier] = useState<TierKey>("founders");
  const fetchCohorts = useServerFn(listCohorts);
  const fetchAvailability = useServerFn(getCohortAvailability);

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

  const selectedCohort = getCohortById(cohorts, cohortId) ?? defaultCohort;

  const { data: availability } = useQuery({
    queryKey: ["cohort-availability", cohortId],
    queryFn: () => fetchAvailability({ data: { cohort_id: cohortId } }),
    enabled: cohortId !== FALLBACK_COHORT.id && Boolean(getCohortById(cohorts, cohortId)),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

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
  useEffect(() => {
    if (cohortId === FALLBACK_COHORT.id && defaultCohort.id !== FALLBACK_COHORT.id) {
      setCohortId(defaultCohort.id);
      setValue("cohort_id", defaultCohort.id, { shouldValidate: false });
    }
  }, [cohortId, defaultCohort.id, setValue]);

  // Auto-roll to cohort tier when founders is sold out for the selected cohort.
  useEffect(() => {
    if (availability?.founders.soldOut && tier === "founders" && !availability.cohortSoldOut) {
      setTier("cohort");
      setValue("tier_interest", "cohort", { shouldValidate: true });
    }
  }, [availability, tier, setValue]);

  const selectTier = (t: TierKey) => {
    const aTier = t === "founders" ? availability?.founders : availability?.cohort;
    if (aTier?.soldOut) return;
    setTier(t);
    setValue("tier_interest", t, { shouldValidate: true });
  };

  const selectCohort = (id: string) => {
    setCohortId(id);
    setValue("cohort_id", id, { shouldValidate: true });
    // reset tier preference so the new cohort's availability picks the right default
    setTier("founders");
    setValue("tier_interest", "founders", { shouldValidate: false });
  };

  const cohortSoldOut = availability?.cohortSoldOut ?? selectedCohort.status === "sold_out";
  const effectiveTier: TierKey = availability?.founders.soldOut ? "cohort" : tier;
  const effectivePriceCents =
    effectiveTier === "founders"
      ? selectedCohort.foundersPriceCents
      : selectedCohort.cohortPriceCents;
  const displayedSeats = Math.ceil(selectedCohort.totalSeats / 2);


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
      <section className="border-b border-white/5 py-12 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            Monthly cohorts · IGNITE Center at Greater Atlanta Christian School, Norcross GA
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Walk in with an idea.{" "}
            <span className="text-gradient-brand">Walk out with a business.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:mt-5 md:text-lg">
            One 8-hour build day. 25 finished deliverables. A formed business, a built website,
            a printed marketing kit, and a signed 90-day launch plan — all done in the room.
          </p>
          <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4 md:mt-6">
            <span className="inline-flex items-center gap-2">
              <Users className="size-4" /> {displayedSeats} seats per cohort
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" /> {EVENT.timeLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" /> Founder-led, build-as-you-go
            </span>
          </div>

          {/* Cohort picker — compact, sits in the hero */}
          <div className="mt-7 md:mt-8">
            <CohortPicker cohorts={cohorts} selectedId={cohortId} onSelect={selectCohort} availability={availability} />
          </div>
        </div>
      </section>

      {/* Value Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-7 max-w-2xl md:mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
              What you actually walk out with
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
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
      <section className="border-y border-white/5 bg-white/[0.02] py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-7 text-center md:mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
              Pick your seat
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              From{" "}
              <span className="text-gradient-brand">
                {formatPriceCents(selectedCohort.foundersPriceCents)}
              </span>
              . All 25 deliverables included.
            </h2>
            {availability && !cohortSoldOut && (() => {
              const pubFoundersCap = toPublicSeats(selectedCohort.foundersSeats);
              const pubCohortCap = toPublicSeats(selectedCohort.cohortSeats);
              const pubFoundersTaken = toPublicTaken(
                availability.founders.displayedTaken,
                selectedCohort.foundersSeats,
                pubFoundersCap,
              );
              const pubCohortTaken = toPublicTaken(
                availability.cohort.displayedTaken,
                selectedCohort.cohortSeats,
                pubCohortCap,
              );
              const pubFoundersLeft = Math.max(pubFoundersCap - pubFoundersTaken, 0);
              const pubCohortLeft = Math.max(pubCohortCap - pubCohortTaken, 0);
              return (
                <p className="mt-3 text-sm text-muted-foreground">
                  {availability.founders.soldOut ? (
                    <>
                      Founders is sold out for this cohort —{" "}
                      <span className="text-foreground">
                        {pubCohortLeft} of {pubCohortCap} Cohort
                        seats left at {formatPriceCents(selectedCohort.cohortPriceCents)}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      <span className="text-foreground">
                        {pubFoundersLeft} of {pubFoundersCap} Founders seats left
                      </span>{" "}
                      at {formatPriceCents(selectedCohort.foundersPriceCents)} — price rolls to{" "}
                      {formatPriceCents(selectedCohort.cohortPriceCents)} when Founders fills.
                    </>
                  )}
                </p>
              );
            })()}
          </div>
          <PricingTiers
            selected={effectiveTier}
            onSelect={selectTier}
            cohort={selectedCohort}
            availability={availability}
            scrollTargetId="register-form"
          />
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16" id="register-form">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
              Reserve your seat
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tell us a bit about your idea so we can tailor the day to your cohort.
            </p>
          </div>
          {submitted ? (
            <SuccessCard tier={effectiveTier} cohort={selectedCohort} priceCents={effectivePriceCents} />
          ) : cohortSoldOut ? (
            <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
              <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-white/10">
                <Lock className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">This cohort is sold out</h3>
              <p className="mt-2 text-muted-foreground">
                All {displayedSeats} seats for {selectedCohort.dateLabel} are claimed.
                Pick another date above to reserve your seat.
              </p>
            </div>
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
                    const isOn = effectiveTier === t;
                    const tierAvail = t === "founders" ? availability?.founders : availability?.cohort;
                    const soldOut = tierAvail?.soldOut ?? false;
                    const price = t === "founders" ? selectedCohort.foundersPriceCents : selectedCohort.cohortPriceCents;
                    const internalCap = t === "founders" ? selectedCohort.foundersSeats : selectedCohort.cohortSeats;
                    const cap = toPublicSeats(internalCap);
                    return (
                      <button
                        type="button"
                        key={t}
                        disabled={soldOut}
                        onClick={() => selectTier(t)}
                        className={`text-left rounded-xl border p-4 transition ${
                          soldOut
                            ? "border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed"
                            : isOn
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-medium">
                            {t === "founders" ? "Founders Seat" : "Cohort Seat"}
                          </span>
                          <span className="tabular-nums font-semibold">{formatPriceCents(price)}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {soldOut
                            ? `Sold out · ${cap}/${cap} claimed`
                            : t === "founders"
                            ? `First ${cap} to register`
                            : `Next ${cap} seats`}
                        </div>
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
                {isSubmitting
                  ? "Reserving…"
                  : `Reserve my ${effectiveTier === "founders" ? "Founders" : "Cohort"} Seat — ${formatPriceCents(effectivePriceCents)}`}
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

function SuccessCard({
  tier,
  cohort,
  priceCents,
}: {
  tier: TierKey;
  cohort: Cohort;
  priceCents: number;
}) {
  const bring = [
    "Your laptop and charger",
    "Headphones (optional)",
    "Any existing brand assets / domain ideas",
    "An open mind and your business idea",
  ];
  const tierLabel = tier === "founders" ? "Founders Seat" : "Cohort Seat";
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-hero-gradient">
        <CheckCircle2 className="size-6 text-white" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">You&apos;re in.</h2>
      <p className="mt-2 text-muted-foreground">
        {tierLabel} ({formatPriceCents(priceCents)}) reserved for {cohort.dateLabel} in{" "}
        {cohort.cityLabel}. Check your email for confirmation and payment instructions shortly.
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
