import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[4]; // Governance
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;
const TOTAL_SLIDES = 5 + TOTAL_DELIVS + 1;

const pl = (i: number) => `${i} / ${TOTAL_SLIDES}`;

const STAGE_BREAKS = [
  {
    title: "A handshake becomes a lawsuit.",
    body: "Without an operating agreement, equity splits, vesting, and exits live in memory — and memories diverge the moment money shows up.",
  },
  {
    title: "One bad day takes the whole business down.",
    body: "No entity, no insurance, no separation between you and the company means a single accident, refund war, or contractor dispute reaches your house and savings.",
  },
  {
    title: "You can't sign the deal you just won.",
    body: "Enterprise buyers, landlords, and grantors need clean docs, a real entity, and basic compliance. Without them, the biggest opportunities quietly disqualify you.",
  },
];

const STAGE_QUESTIONS = [
  "Is the entity, ownership, and vesting written down — and signed?",
  "If something went wrong tomorrow, what's between the business and your personal life?",
  "Do you have the contracts a real customer, hire, or partner expects?",
  "Are you compliant enough to take the next deal without scrambling?",
];

const DELIV_IMAGES = [
  { src: "/decks/governance/06-deliv-1.jpg", alt: "Founder and attorney calmly co-signing a folded charter beside a wax-seal stamp" },
  { src: "/decks/governance/07-deliv-2.jpg", alt: "Composed founder pinning numbered risk cards on a quiet grid, weighing a small brass paperweight" },
  { src: "/decks/governance/08-deliv-3.jpg", alt: "Small round meeting table with composed advisors and one founder, open binder between them" },
];

export const governanceSlides: Slide[] = [
  {
    id: "cover",
    title: "Governance — Cover",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(1)} variant="dark">
        <div className="max-w-[1400px]">
          <SlotText
            slideId="cover"
            field="kicker"
            defaultValue={`Stage ${STAGE.number} of ${String(TOTAL_STAGES).padStart(2, "0")}`}
            as="div"
            className="slide-kicker font-semibold text-white/60 mb-10"
          />
          <SlotText slideId="cover" field="title" defaultValue="Governance." as="h1" className="slide-title-lg font-semibold tracking-tight" />
          <SlotText
            slideId="cover"
            field="subtitle"
            defaultValue="The structure that lets you sleep — and lets the business outlive a bad week. Governance protects what Finance is building."
            as="p"
            className="slide-subtitle mt-10 text-white/80 max-w-[1200px]"
          />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/governance/01-cover.jpg"
            defaultAlt="Composed founder and calm attorney shaking hands across a tidy desk with a leather binder and a small stone-arch model"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "stakes",
    title: "Why Governance exists",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(2)}>
        <div className="max-w-[1500px]">
          <SlotText slideId="stakes" field="kicker" defaultValue="Why this stage exists" as="div" className="slide-kicker font-semibold text-primary mb-8" />
          <h2 className="slide-title font-semibold tracking-tight">
            <SlotText
              slideId="stakes"
              field="title"
              defaultValue="Governance is boring on a good day and priceless on a bad one — it's how a startup survives surprise."
            />
          </h2>
          <SlotText
            slideId="stakes"
            field="body"
            defaultValue="Get this right and the business can take a hit, a hire, a partner, or a payout without unraveling. Skip it and the first real problem turns into the last one."
            as="p"
            className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]"
          />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/governance/02-stakes.jpg"
            defaultAlt="Thoughtful founder under a sturdy stone arch at dawn, calmly watching distant weather"
            className="mt-10 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "what-breaks",
    title: "What breaks without it",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(3)}>
        <div className="grid grid-cols-12 gap-10 items-start">
          <div className="col-span-7">
            <SlotText slideId="what-breaks" field="kicker" defaultValue="What breaks without it" as="div" className="slide-kicker font-semibold text-primary mb-6" />
            <SlotText
              slideId="what-breaks"
              field="title"
              defaultValue="Three expensive mistakes Governance prevents."
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-5">
              {STAGE_BREAKS.map((r, i) => (
                <div key={r.title} className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6 flex gap-5">
                  <AlertTriangle className="text-destructive shrink-0" style={{ width: 40, height: 40 }} />
                  <div>
                    <SlotText
                      slideId="what-breaks"
                      field={`card.${i}.title`}
                      defaultValue={r.title}
                      as="h3"
                      className="slide-body-lg font-semibold tracking-tight mb-2"
                    />
                    <SlotText slideId="what-breaks" field={`card.${i}.body`} defaultValue={r.body} as="p" className="slide-body text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 flex items-center justify-center">
            <SlotImage
              slideId="what-breaks"
              field="image"
              defaultSrc="/decks/governance/03-what-breaks.jpg"
              defaultAlt="Three quiet vignettes: a torn napkin handshake, a leaky-roof workbench, and a sealed gate with an unsigned folio"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "what-good",
    title: "What good looks like",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(4)}>
        <div className="grid grid-cols-12 gap-10 items-center">
          <div className="col-span-7">
            <SlotText slideId="what-good" field="kicker" defaultValue="What good looks like" as="div" className="slide-kicker font-semibold text-primary mb-6" />
            <SlotText
              slideId="what-good"
              field="title"
              defaultValue="A founder who can answer four questions with a binder, not a guess."
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-4">
              {STAGE_QUESTIONS.map((q, i) => (
                <div key={i} className="flex items-start gap-5 rounded-2xl bg-primary/5 border border-primary/15 p-6">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" style={{ width: 36, height: 36 }} />
                  <SlotText slideId="what-good" field={`q.${i}`} defaultValue={q} className="slide-body-lg font-medium" />
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 flex items-center justify-center">
            <SlotImage
              slideId="what-good"
              field="image"
              defaultSrc="/decks/governance/04-what-good.jpg"
              defaultAlt="Composed founder answering a small panel of listeners with a tidy tabbed binder open on the desk"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "deliverables-overview",
    title: `The ${TOTAL_DELIVS} startup assets`,
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(5)}>
        <div className="grid grid-cols-12 gap-10 items-center">
          <div className="col-span-7">
            <SlotText slideId="deliverables-overview" field="kicker" defaultValue="What you walk out with" as="div" className="slide-kicker font-semibold text-primary mb-6" />
            <SlotText
              slideId="deliverables-overview"
              field="title"
              defaultValue={`${TOTAL_DELIVS} founder-ready startup assets — built for your startup.`}
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-4">
              {STAGE.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-5 rounded-2xl border bg-card p-6">
                    <div className="rounded-2xl bg-primary/10 p-4 shrink-0">
                      <Icon className="text-primary" style={{ width: 40, height: 40 }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="slide-caption text-muted-foreground font-medium">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <SlotText
                        slideId="deliverables-overview"
                        field={`item.${i}.title`}
                        defaultValue={item.title}
                        as="div"
                        className="slide-body-lg font-semibold tracking-tight"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-span-5 flex items-center justify-center">
            <SlotImage
              slideId="deliverables-overview"
              field="image"
              defaultSrc="/decks/governance/05-deliverables.jpg"
              defaultAlt="Calm craftsperson arranging a ribboned legal document, a small ledger, and a miniature meeting table on a workbench"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  ...STAGE.items.map((item, i) => {
    const art = DELIV_IMAGES[i];
    return {
      id: `deliv-${i}`,
      title: item.title,
      render: () => (
        <DeliverableSlide
          stageKicker={KICKER}
          pageLabel={pl(6 + i)}
          index={i + 1}
          total={TOTAL_DELIVS}
          deliverable={item}
          slideId={`deliv-${i}`}
          imageSrc={art?.src}
          imageAlt={art?.alt}
        />
      ),
    };
  }),
  {
    id: "recap",
    title: "Recap — what's next",
    render: () => {
      const next = FRAMEWORK_STAGES[5];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(TOTAL_SLIDES)} variant="dark">
          <div className="grid grid-cols-12 gap-10 items-center">
            <div className="col-span-7">
              <SlotText slideId="recap" field="kicker" defaultValue="Recap · what's next" as="div" className="slide-kicker font-semibold text-white/60 mb-8" />
              <SlotText
                slideId="recap"
                field="title"
                defaultValue="Governance is the quiet armor that makes everything else worth building."
                as="h2"
                className="slide-title font-semibold tracking-tight"
              />
              <p className="slide-subtitle mt-8 text-white/80">
                Next up — <span className="text-primary font-semibold">{next.number} {next.name}</span>:{" "}
                {next.intro.toLowerCase()}
              </p>
              <div className="mt-12 inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-primary text-primary-foreground slide-body-lg font-semibold">
                <SlotText slideId="recap" field="cta" defaultValue={`Open the ${next.name} deck`} />
                <ArrowRight style={{ width: 36, height: 36 }} />
              </div>
            </div>
            <div className="col-span-5 flex items-center justify-center">
              <SlotImage
                slideId="recap"
                field="image"
                defaultSrc="/decks/governance/09-recap.jpg"
                defaultAlt="Founder walking calmly through an open stone gate at dawn carrying a tied folio toward a long open road"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
