import { FRAMEWORK_STAGES, FOUNDATION_FIRST_REASONS } from "@/lib/framework-deliverables";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[0]; // Foundation
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;

const pl = (i: number, total: number) => `${i} / ${total}`;

export const foundationSlides: Slide[] = [
  // 1. Cover
  {
    id: "cover",
    title: "Foundation — Cover",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(1, 10)} variant="dark">
        <div className="max-w-[1400px]">
          <div className="slide-kicker font-semibold text-white/60 mb-10">
            Stage {STAGE.number} of {String(TOTAL_STAGES).padStart(2, "0")}
          </div>
          <h1 className="slide-title-lg font-semibold tracking-tight">Foundation.</h1>
          <p className="slide-subtitle mt-10 text-white/80 max-w-[1200px]">
            The bedrock every defensible startup is built on. Get this right and everything downstream gets easier, sharper, faster.
          </p>
        </div>
      </SlideLayout>
    ),
  },

  // 2. The stakes
  {
    id: "stakes",
    title: "Why Foundation exists",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(2, 10)}>
        <div className="max-w-[1500px]">
          <div className="slide-kicker font-semibold text-primary mb-8">Why this stage exists</div>
          <h2 className="slide-title font-semibold tracking-tight">
            Everything downstream — your brand, your site, your pitch, your pricing —{" "}
            <span className="text-primary">inherits whatever you decide here.</span>
          </h2>
          <p className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]">
            Skip Foundation and you'll pay for it later in redos, refunds, and ad spend that doesn't convert.
          </p>
        </div>
      </SlideLayout>
    ),
  },

  // 3. What breaks without it (3 cards from FOUNDATION_FIRST_REASONS)
  {
    id: "what-breaks",
    title: "What breaks without it",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(3, 10)}>
        <div>
          <div className="slide-kicker font-semibold text-primary mb-6">What breaks without it</div>
          <h2 className="slide-title font-semibold tracking-tight mb-14">Three expensive mistakes Foundation prevents.</h2>
          <div className="grid grid-cols-3 gap-8">
            {FOUNDATION_FIRST_REASONS.map((r) => (
              <div key={r.title} className="rounded-3xl border-2 border-destructive/20 bg-destructive/5 p-10 min-h-[420px] flex flex-col">
                <AlertTriangle className="text-destructive mb-6" style={{ width: 56, height: 56 }} />
                <h3 className="slide-body-lg font-semibold tracking-tight mb-5">{r.title}</h3>
                <p className="slide-body text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </SlideLayout>
    ),
  },

  // 4. What good looks like
  {
    id: "what-good",
    title: "What good looks like",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(4, 10)}>
        <div className="max-w-[1500px]">
          <div className="slide-kicker font-semibold text-primary mb-6">What good looks like</div>
          <h2 className="slide-title font-semibold tracking-tight mb-12">
            A founder who can answer four questions in plain language.
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              "Who exactly do you serve?",
              "What painful problem do you solve?",
              "Why now — and why you?",
              "Why pick you over every alternative?",
            ].map((q) => (
              <div key={q} className="flex items-start gap-5 rounded-2xl bg-primary/5 border border-primary/15 p-8">
                <CheckCircle2 className="text-primary shrink-0 mt-1" style={{ width: 44, height: 44 }} />
                <span className="slide-body-lg font-medium">{q}</span>
              </div>
            ))}
          </div>
        </div>
      </SlideLayout>
    ),
  },

  // 5. The four deliverables
  {
    id: "deliverables-overview",
    title: "The four deliverables",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(5, 10)}>
        <div>
          <div className="slide-kicker font-semibold text-primary mb-6">What you walk out with</div>
          <h2 className="slide-title font-semibold tracking-tight mb-12">
            Four founder-ready deliverables — built for your startup.
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {STAGE.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-6 rounded-2xl border bg-card p-8">
                  <div className="rounded-2xl bg-primary/10 p-5 shrink-0">
                    <Icon className="text-primary" style={{ width: 56, height: 56 }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="slide-caption text-muted-foreground font-medium">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="slide-body-lg font-semibold tracking-tight">{item.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SlideLayout>
    ),
  },

  // 6-9. One slide per deliverable
  ...STAGE.items.map((item, i) => ({
    id: `deliv-${i}`,
    title: item.title,
    render: () => (
      <DeliverableSlide
        stageKicker={KICKER}
        pageLabel={pl(6 + i, 10)}
        index={i + 1}
        total={TOTAL_DELIVS}
        deliverable={item}
      />
    ),
  })),

  // 10. Recap + what's next
  {
    id: "recap",
    title: "Recap — what's next",
    render: () => {
      const next = FRAMEWORK_STAGES[1];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(10, 10)} variant="dark">
          <div className="max-w-[1500px]">
            <div className="slide-kicker font-semibold text-white/60 mb-10">Recap · what's next</div>
            <h2 className="slide-title font-semibold tracking-tight">
              Foundation locks the truth.
            </h2>
            <p className="slide-subtitle mt-10 text-white/80 max-w-[1300px]">
              Next up — <span className="text-primary font-semibold">{next.number} {next.name}</span>: {next.intro.toLowerCase()}
            </p>
            <div className="mt-16 inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-primary text-primary-foreground slide-body-lg font-semibold">
              Open the {next.name} deck <ArrowRight style={{ width: 36, height: 36 }} />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
