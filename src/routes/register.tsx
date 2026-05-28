import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { createRegistration } from "@/lib/registrations.functions";
import { EVENT } from "@/lib/schedule-data";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Atlanta Startup Workshop" },
      {
        name: "description",
        content: "Reserve one of 20 seats for the Atlanta Startup Workshop on July 23, 2026.",
      },
      { property: "og:title", content: "Register — Atlanta Startup Workshop" },
      {
        property: "og:description",
        content: "Tell us about your idea and lock in your seat.",
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
});

type FormValues = z.infer<typeof FormSchema>;

function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const submit = useServerFn(createRegistration);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { stage: "idea", industry: "" },
  });

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
      <section className="border-b border-white/5 py-16">
        <div className="mx-auto max-w-2xl px-6">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {EVENT.dateLabel} · IGNITE Center at Greater Atlanta Christian School, Norcross, GA
          </p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            Reserve <span className="text-gradient-brand">your seat</span>.
          </h1>
          <p className="mt-4 text-muted-foreground">
            20 seats, first-come. Tell us a little about what you want to build so we can
            tailor the workshop to your cohort.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-2xl px-6">
          {submitted ? (
            <SuccessCard />
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 md:p-8"
            >
              <Field label="Full name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  className="input"
                  placeholder="Your name"
                  autoComplete="name"
                />
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
                <input
                  {...register("phone")}
                  className="input"
                  placeholder="+1 (404) 555-0123"
                  autoComplete="tel"
                />
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
              <Field label="How did you hear about us? (optional)" error={errors.referral_source?.message}>
                <input
                  {...register("referral_source")}
                  className="input"
                  placeholder="Friend, Instagram, search…"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Reserving…" : "Reserve my seat"}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                We&apos;ll follow up with confirmation and what to bring.
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

function SuccessCard() {
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
        Seat reserved for {EVENT.dateLabel}. Check your email for a follow-up shortly.
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
          href={EVENT.mapsUrl}
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
