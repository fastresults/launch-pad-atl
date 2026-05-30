import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { submitFounderApplication } from "@/lib/applications.functions";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Sparkles, Users } from "lucide-react";

const FormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  about_you: z
    .string()
    .trim()
    .min(60, "Tell us a bit more — at least a couple of sentences")
    .max(1500),
  about_startup: z
    .string()
    .trim()
    .min(60, "Tell us a bit more — at least a couple of sentences")
    .max(2000),
  why_now: z
    .string()
    .trim()
    .min(30, "A sentence or two helps us understand fit")
    .max(1000),
  stage: z.enum(["idea", "early", "existing"]),
  industry: z.string().trim().min(1, "Pick an industry"),
  linkedin_url: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal("")),
  can_attend: z.literal(true, {
    message: "You must be able to attend on July 23, 2026",
  }),
  referral_source: z.string().trim().max(120).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof FormSchema>;

export function RegisterSelection() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const submit = useServerFn(submitFounderApplication);

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

      {/* Hero */}
      <section className="border-b border-white/5 py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            <Sparkles className="size-3.5" /> Atlanta · Inaugural Cohort · Apply for a free seat
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Apply to join the{" "}
            <span className="text-gradient-brand">six.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:mt-5 md:text-lg">
            We&rsquo;re selecting six Atlanta startup founders for a free full-day build workshop
            on July 23, 2026. Tell us a little about you and your startup — we&rsquo;ll email a
            decision by July 15.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <Users className="size-4" /> 6 seats
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" /> Thursday, July 23, 2026
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4" /> IGNITE Center · Norcross, GA
            </span>
          </div>
        </div>
      </section>

      {/* Form / Success */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-6">
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
                label="Tell us about you"
                hint="Background, what you&rsquo;re working on now, what you&rsquo;ve built before."
                error={errors.about_you?.message}
              >
                <textarea
                  {...register("about_you")}
                  rows={5}
                  className="input resize-y"
                  placeholder="A short paragraph about who you are and what you&rsquo;ve been up to."
                />
              </Field>

              <Field
                label="Tell us about your startup"
                hint="What is it, who&rsquo;s it for, what problem are you solving?"
                error={errors.about_startup?.message}
              >
                <textarea
                  {...register("about_startup")}
                  rows={6}
                  className="input resize-y"
                  placeholder="The idea, the customer, the problem, and where you are with it today."
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

              <Field
                label="Why this workshop, why now?"
                error={errors.why_now?.message}
              >
                <textarea
                  {...register("why_now")}
                  rows={4}
                  className="input resize-y"
                  placeholder="What would change for you if you walked out July 23 with a launched business?"
                />
              </Field>

              <Field
                label="LinkedIn URL (optional)"
                error={errors.linkedin_url?.message}
              >
                <input
                  {...register("linkedin_url")}
                  className="input"
                  placeholder="https://www.linkedin.com/in/…"
                />
              </Field>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    {...register("can_attend")}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    <span className="font-medium text-foreground">
                      I can attend in person on Thursday, July 23, 2026
                    </span>{" "}
                    at the IGNITE Center in Norcross, GA — the full day (8:00 AM – 4:30 PM).
                  </span>
                </label>
                {errors.can_attend?.message && (
                  <div className="mt-1 text-xs text-destructive">{errors.can_attend.message}</div>
                )}
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Submitting…" : "Submit application"}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                We&rsquo;ll email you a decision by July 15, 2026.
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
      {hint && (
        <span
          className="mb-1.5 block text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: hint }}
        />
      )}
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function SuccessCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-hero-gradient">
        <CheckCircle2 className="size-6 text-white" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">Application received.</h2>
      <p className="mt-2 text-muted-foreground">
        Thanks — we&rsquo;ve got it. We&rsquo;ll email every applicant a decision by{" "}
        <span className="font-medium text-foreground">July 15, 2026</span>. If selected, you&rsquo;ll
        get logistics and what to bring to the IGNITE Center on July 23.
      </p>
      <div className="mt-8 rounded-xl border border-white/10 p-5 text-left">
        <div className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          While you wait
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
            Keep refining your startup idea — every sentence counts on selection day.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
            Know an Atlanta founder who&rsquo;d be a fit? Send them our way.
          </li>
        </ul>
      </div>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
