import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { submitFounderApplication } from "@/lib/applications.functions";
import { ArrowRight, CheckCircle2, Sparkles, TicketPercent } from "lucide-react";

// Keep in sync with HomeSelection — TBD with founder.
const FINALIST_DISCOUNT_PCT = 40;

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
            <Sparkles className="size-3.5" /> Atlanta · Inaugural Cohort · Application
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Apply for one of{" "}
            <span className="text-gradient-brand">the six.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:mt-5 md:text-lg">
            Applications close <span className="font-medium text-foreground">June 20, 2026</span>.
            Dozens will apply. Six will be chosen by{" "}
            <span className="font-medium text-foreground">July 8</span>. Every other applicant
            gets a <span className="font-medium text-foreground">Founder&rsquo;s Discount</span>{" "}
            on the next cohort, sent the same day. Twelve minutes, no fee, no follow-up sales call.
          </p>

          {/* Trust strip */}
          <ul className="mx-auto mt-8 grid max-w-2xl gap-2 text-left text-sm sm:grid-cols-2">
            {[
              "6 seats · 0 cost · 0 strings",
              "Decision by July 8 — every applicant hears back",
              `Not chosen? ${FINALIST_DISCOUNT_PCT}% Founder's Discount, same day`,
              "Adam reads every application personally",
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 rounded-xl border border-white/10 bg-card/60 px-3 py-2 text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
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
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
                We&rsquo;re choosing six from dozens — write like you&rsquo;re talking to one
                person who&rsquo;s rooting for you. Half-sentences and buzzwords don&rsquo;t make
                the cut.
              </div>

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
                hint="Where you come from, what you&rsquo;re doing right now, what you&rsquo;ve shipped before — even if it was a side project. Specifics earn the read."
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
                hint="What is it, who exactly is the first customer, what problem are you ending for them? Name the person, the price, and the moment they&rsquo;d buy."
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
                hint="What actually changes in your life if you walk out July 23 with a launched startup? Be concrete — money, time, freedom, a person you want to prove something to."
                error={errors.why_now?.message}
              >
                <textarea
                  {...register("why_now")}
                  rows={4}
                  className="input resize-y"
                  placeholder="Write it like you&rsquo;d say it to a friend over coffee."
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
                You&rsquo;ll hear from us by July 8 — either a seat or a Founder&rsquo;s Discount.
                No silent rejections.
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
      <h2 className="text-2xl font-semibold tracking-tight">You&rsquo;re in the running.</h2>
      <p className="mt-2 text-muted-foreground">
        We&rsquo;ve got it. Between now and{" "}
        <span className="font-medium text-foreground">July 8, 2026</span>, Adam is reading every
        application personally. On July 8 you&rsquo;ll get one of two emails — a seat for July 23,
        or a {FINALIST_DISCOUNT_PCT}% Founder&rsquo;s Discount on the next Atlanta cohort. Either
        way, you&rsquo;ll hear from us.
      </p>

      <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5 text-left">
        <div className="mb-2 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-primary">
          <TicketPercent className="size-4" /> Floor, not ceiling
        </div>
        <p className="text-sm text-muted-foreground">
          The worst outcome here is a {FINALIST_DISCOUNT_PCT}% discount and a front-row seat to
          watch six Atlanta founders launch in public. Watch the inbox on July 8 — the
          Founder&rsquo;s Discount is single-use and time-bound.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 p-5 text-left">
        <div className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          While you wait
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
            Keep sharpening the answer to &ldquo;who&rsquo;s the first customer?&rdquo; — every
            specific sentence helps on selection day.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
            Know an Atlanta founder who&rsquo;d be a fit? Send them our way — the bench gets
            deeper, and you both benefit.
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
        >
          Back to home
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-hero-gradient px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Have a question? Contact us
        </Link>
      </div>
    </div>
  );
}
