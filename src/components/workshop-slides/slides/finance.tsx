import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { STAGE_PRODUCTIZATION } from "@/lib/workshop-productization";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
import { buildProductizationSlides } from "../ProductizationSlides";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[3]; // Finance
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const PROD = STAGE_PRODUCTIZATION["finance"];
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;
// 5 overview + 4 productization + N per-deliverable + 1 recap
const TOTAL_SLIDES = 5 + 4 + TOTAL_DELIVS + 1;

const pl = (i: number) => `${i} / ${TOTAL_SLIDES}`;

const STAGE_BREAKS = [
  {
    title: "You run out of cash before traction.",
    body: "Without a real model, you can't see the month the bank balance goes red — you just live it. Most startups die from a cash gap they could have predicted six months earlier.",
  },
  {
    title: "You price by feel and lose money winning.",
    body: "When the unit economics aren't written down, every sale could be a quiet loss. You scale the wrong customers and discover the math too late to fix it.",
  },
  {
    title: "You chase the wrong kind of money.",
    body: "Founders pitch investors when a loan is cheaper, or borrow when a grant exists. The result is dilution, debt, or wasted months — and a cap table you'll regret.",
  },
];

const STAGE_QUESTIONS = [
  "When does cash get tight — and what's your plan three months before it does?",
  "What does one customer actually cost to win and earn back?",
  "Which type of capital fits this business — and which would kill it?",
  "Could you walk into a bank, SBA office, or partner meeting with documents they expect?",
];

const DELIV_IMAGES = [
  { src: "/decks/finance/06-deliv-1.jpg", alt: "Composed founder drafting a twelve-month ledger by lamplight" },
  { src: "/decks/finance/07-deliv-2.jpg", alt: "Shopkeeper balancing a coin against a wrapped customer parcel on brass scales" },
  { src: "/decks/finance/08-deliv-3.jpg", alt: "Founder at a quiet crossroads of small symbol-topped signposts" },
  { src: "/decks/finance/09-deliv-4.jpg", alt: "Founder calmly handing a leather folio to a composed loan officer" },
  { src: "/decks/finance/10-deliv-5.jpg", alt: "Founder placing a single story card on an easel for attentive listeners" },
];

export const financeSlides: Slide[] = [
  {
    id: "cover",
    title: "Finance — Cover",
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
          <SlotText
            slideId="cover"
            field="title"
            defaultValue="Finance."
            as="h1"
            className="slide-title-lg font-semibold tracking-tight"
          />
          <SlotText
            slideId="cover"
            field="subtitle"
            defaultValue="The numbers investors, banks, and you can trust. Finance turns your plan into math a partner can underwrite — and a founder can sleep on."
            as="p"
            className="slide-subtitle mt-10 text-white/80 max-w-[1200px]"
          />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/finance/01-cover.jpg"
            defaultAlt="Composed banker and calm founder reviewing an open ledger across a tidy desk"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "stakes",
    title: "Why Finance exists",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(2)}>
        <div className="max-w-[1500px]">
          <SlotText
            slideId="stakes"
            field="kicker"
            defaultValue="Why this stage exists"
            as="div"
            className="slide-kicker font-semibold text-primary mb-8"
          />
          <h2 className="slide-title font-semibold tracking-tight">
            <SlotText
              slideId="stakes"
              field="title"
              defaultValue="Finance is how a good idea survives twelve months — and how a founder earns the right to ask for capital."
            />
          </h2>
          <SlotText
            slideId="stakes"
            field="body"
            defaultValue="Nail this stage and every pricing call, hire, and pitch rests on numbers you defend in your sleep. Skip it and gut decisions compound until the math finally catches you."
            as="p"
            className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]"
          />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/finance/02-stakes.jpg"
            defaultAlt="Thoughtful founder studying a candle that doubles as a runway gauge"
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
            <SlotText
              slideId="what-breaks"
              field="kicker"
              defaultValue="What breaks without it"
              as="div"
              className="slide-kicker font-semibold text-primary mb-6"
            />
            <SlotText
              slideId="what-breaks"
              field="title"
              defaultValue="Three expensive mistakes Finance prevents."
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-5">
              {STAGE_BREAKS.map((r, i) => (
                <div
                  key={r.title}
                  className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6 flex gap-5"
                >
                  <AlertTriangle className="text-destructive shrink-0" style={{ width: 40, height: 40 }} />
                  <div>
                    <SlotText
                      slideId="what-breaks"
                      field={`card.${i}.title`}
                      defaultValue={r.title}
                      as="h3"
                      className="slide-body-lg font-semibold tracking-tight mb-2"
                    />
                    <SlotText
                      slideId="what-breaks"
                      field={`card.${i}.body`}
                      defaultValue={r.body}
                      as="p"
                      className="slide-body text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 flex items-center justify-center">
            <SlotImage
              slideId="what-breaks"
              field="image"
              defaultSrc="/decks/finance/03-what-breaks.jpg"
              defaultAlt="Three vignettes: piggy bank, brass scales, and a quiet crossroads"
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
            <SlotText
              slideId="what-good"
              field="kicker"
              defaultValue="What good looks like"
              as="div"
              className="slide-kicker font-semibold text-primary mb-6"
            />
            <SlotText
              slideId="what-good"
              field="title"
              defaultValue="A founder who can answer four questions with numbers a banker would sign off on."
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-4">
              {STAGE_QUESTIONS.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-5 rounded-2xl bg-primary/5 border border-primary/15 p-6"
                >
                  <CheckCircle2 className="text-primary shrink-0 mt-1" style={{ width: 36, height: 36 }} />
                  <SlotText
                    slideId="what-good"
                    field={`q.${i}`}
                    defaultValue={q}
                    className="slide-body-lg font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-5 flex items-center justify-center">
            <SlotImage
              slideId="what-good"
              field="image"
              defaultSrc="/decks/finance/04-what-good.jpg"
              defaultAlt="Composed founder presenting tidy diagrams to a seated banker and partner"
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
            <SlotText
              slideId="deliverables-overview"
              field="kicker"
              defaultValue="What you walk out with"
              as="div"
              className="slide-kicker font-semibold text-primary mb-6"
            />
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
              defaultSrc="/decks/finance/05-deliverables.jpg"
              defaultAlt="Calm craftsman arranging five financial instruments on a workbench"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  // Productization slides (Build tool · Live worksheet · Ship-ready artifact · Take-home kit)
  ...buildProductizationSlides("finance", KICKER, PROD, pl, FRAMEWORK_STAGES[4]?.name),

  ...STAGE.items.map((item, i) => {
    const art = DELIV_IMAGES[i];
    return {
      id: `deliv-${i}`,
      title: item.title,
      render: () => (
        <DeliverableSlide
          stageKicker={KICKER}
          pageLabel={pl(10 + i)}
          index={i + 1}
          total={TOTAL_DELIVS}
          deliverable={item}
          slideId={`deliv-${i}`}
          imageSrc={art?.src}
          imageAlt={art?.alt}
          detail={PROD.deliverableDetails[i]}
        />
      ),
    };
  }),
  {
    id: "recap",
    title: "Recap — what's next",
    render: () => {
      const next = FRAMEWORK_STAGES[4];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(TOTAL_SLIDES)} variant="dark">
          <div className="grid grid-cols-12 gap-10 items-center">
            <div className="col-span-7">
              <SlotText
                slideId="recap"
                field="kicker"
                defaultValue="Recap · what's next"
                as="div"
                className="slide-kicker font-semibold text-white/60 mb-8"
              />
              <SlotText
                slideId="recap"
                field="title"
                defaultValue="Finance is how a founder earns trust — with bankers, partners, and themselves."
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
                defaultSrc="/decks/finance/11-recap.jpg"
                defaultAlt="Two figures passing a sealed envelope on a quiet path toward an open gate at dawn"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
