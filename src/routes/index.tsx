import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { EVENT, FLOW_STAGES } from "@/lib/schedule-data";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlanta Startup Workshop — Start your business in one day" },
      {
        name: "description",
        content:
          "One-day hands-on workshop in Norcross, GA. 20 seats. Walk in with an idea, walk out with a launched business.",
      },
      { property: "og:title", content: "Atlanta Startup Workshop — One day. One business." },
      {
        property: "og:description",
        content: "July 23, 2026 in Norcross, GA. Ideate → plan → develop → launch → grow.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <FlowStrip />
      <Deliverables />
      <VenueCard />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-white/80">
          Atlanta · Norcross, GA
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
          Start your business <br /> in <span className="italic">one day</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/90">
          A hands-on workshop for 20 people. Bring your laptop and an idea — leave with a
          launched business, a brand, a landing page, and a 30-day plan.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reserve your seat <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/schedule"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            See the 6-hour flow
          </Link>
        </div>
        <div className="mt-12 grid max-w-2xl grid-cols-1 gap-4 text-white/90 sm:grid-cols-3">
          <Meta icon={<Calendar className="size-4" />} label={EVENT.dateLabel} />
          <Meta icon={<MapPin className="size-4" />} label="Norcross, GA" />
          <Meta icon={<Users className="size-4" />} label={`${EVENT.capacity} seats`} />
        </div>
      </div>
    </section>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm backdrop-blur">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function FlowStrip() {
  return (
    <section className="border-y border-white/5 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          The flow
        </h2>
        <p className="mb-12 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
          Six stages. One day. <span className="text-gradient-brand">A real business.</span>
        </p>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {FLOW_STAGES.map((s) => (
            <div
              key={s.key}
              className="rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/25"
            >
              <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
                {s.n}
              </div>
              <div className="text-base font-medium">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Deliverables() {
  const items = [
    "A validated business idea & customer profile",
    "A registered domain and basic brand kit",
    "A live landing page with a working checkout",
    "An outreach list and first-customer playbook",
    "A 30-day plan with metrics that matter",
    "An accountability partner from the cohort",
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          What you leave with
        </h2>
        <p className="mb-10 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
          Not slides. Not theory. <span className="text-gradient-brand">A launched business.</span>
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-card p-4"
            >
              <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-hero-gradient" />
              <span className="text-foreground">{i}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VenueCard() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-card">
          <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
            <div>
              <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Where it happens
              </h2>
              <p className="text-3xl font-semibold tracking-tight md:text-4xl">
                {EVENT.venueName}
              </p>
              <p className="mt-3 text-muted-foreground">{EVENT.address}</p>
              <p className="mt-1 text-muted-foreground">
                {EVENT.dateLabel} · {EVENT.timeLabel}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={EVENT.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
                >
                  <MapPin className="size-4" /> Open in maps
                </a>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Reserve seat <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-hero-gradient">
              <div
                className="absolute inset-0 mix-blend-overlay opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
              <div className="relative flex h-full flex-col justify-end p-6 text-white">
                <div className="text-sm uppercase tracking-[0.2em] opacity-80">Capacity</div>
                <div className="text-5xl font-semibold">{EVENT.capacity} seats</div>
                <div className="mt-1 text-sm opacity-80">Small cohort, high attention.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
