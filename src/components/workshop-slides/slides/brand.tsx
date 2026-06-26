import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[5]; // Brand
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;
const TOTAL_SLIDES = 5 + TOTAL_DELIVS + 1;

const pl = (i: number) => `${i} / ${TOTAL_SLIDES}`;

const STAGE_BREAKS = [
  {
    title: "You compete on price you can't afford.",
    body: "Without a brand worth a premium, the only lever left is discount. Margin disappears, the best customers walk past, and growth gets more expensive every quarter.",
  },
  {
    title: "Every touchpoint feels like a different company.",
    body: "Site, social, packaging, and pitch all drift in their own direction. Customers feel the inconsistency before they can name it — and trust quietly erodes.",
  },
  {
    title: "You rebrand every six months.",
    body: "No strategy means every new vendor, intern, or trend triggers another redesign. You burn time and money chasing a feeling that a real framework would have settled on day one.",
  },
];

const STAGE_QUESTIONS = [
  "Can you state your brand promise in one sentence a stranger would believe?",
  "Does every channel sound and look like the same company?",
  "Could a freelancer ship on-brand work without you in the room?",
  "Is your identity earning the price you actually want to charge?",
];

const DELIV_IMAGES = [
  { src: "/decks/brand/06-deliv-1.jpg", alt: "Composed founder kneeling beside a brass compass on a wooden floor, drawing a careful foundation line" },
  { src: "/decks/brand/07-deliv-2.jpg", alt: "Calm founder inside a small house-shaped pavilion arranging message cards in a clear hierarchy on a pegboard" },
  { src: "/decks/brand/08-deliv-3.jpg", alt: "Founder handing a tidy brief and a fan of color swatches to a quietly attentive designer at a studio table" },
  { src: "/decks/brand/09-deliv-4.jpg", alt: "Calm founder holding a small brass tuning fork to their ear, listening for the right tone" },
  { src: "/decks/brand/10-deliv-5.jpg", alt: "Founder handing a beautifully bound guidelines book across a counter to a calm freelancer" },
];

export const brandSlides: Slide[] = [
  {
    id: "cover",
    title: "Brand — Cover",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(1)} variant="dark">
        <div className="max-w-[1400px]">
          <SlotText slideId="cover" field="kicker" defaultValue={`Stage ${STAGE.number} of ${String(TOTAL_STAGES).padStart(2, "0")}`} as="div" className="slide-kicker font-semibold text-white/60 mb-10" />
          <SlotText slideId="cover" field="title" defaultValue="Brand." as="h1" className="slide-title-lg font-semibold tracking-tight" />
          <SlotText slideId="cover" field="subtitle" defaultValue="An identity worth premium pricing — a system, not stickers. Brand turns the work of Foundation through Governance into something a customer can feel." as="p" className="slide-subtitle mt-10 text-white/80 max-w-[1200px]" />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/brand/01-cover.jpg"
            defaultAlt="Composed founder beside an easel showing a single elegant brand emblem, swatch fan and brand book on the table"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "stakes",
    title: "Why Brand exists",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(2)}>
        <div className="max-w-[1500px]">
          <SlotText slideId="stakes" field="kicker" defaultValue="Why this stage exists" as="div" className="slide-kicker font-semibold text-primary mb-8" />
          <h2 className="slide-title font-semibold tracking-tight">
            <SlotText slideId="stakes" field="title" defaultValue="Brand is the cheapest competitive advantage you'll ever build — and the most expensive one to fake." />
          </h2>
          <SlotText slideId="stakes" field="body" defaultValue="Get this stage right and customers pay more, refer faster, and forgive sooner. Skip it and you'll spend every marketing dollar overcoming a first impression you never designed." as="p" className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]" />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/brand/02-stakes.jpg"
            defaultAlt="Calm shopkeeper-founder placing a premium-priced card next to a beautifully wrapped parcel as a customer reaches with interest"
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
            <SlotText slideId="what-breaks" field="title" defaultValue="Three expensive mistakes Brand prevents." as="h2" className="slide-title font-semibold tracking-tight mb-10" />
            <div className="grid grid-cols-1 gap-5">
              {STAGE_BREAKS.map((r, i) => (
                <div key={r.title} className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6 flex gap-5">
                  <AlertTriangle className="text-destructive shrink-0" style={{ width: 40, height: 40 }} />
                  <div>
                    <SlotText slideId="what-breaks" field={`card.${i}.title`} defaultValue={r.title} as="h3" className="slide-body-lg font-semibold tracking-tight mb-2" />
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
              defaultSrc="/decks/brand/03-what-breaks.jpg"
              defaultAlt="Three vignettes: a discounted vessel, three mismatched storefronts, and a designer peeling old posters off a wall"
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
            <SlotText slideId="what-good" field="title" defaultValue="A founder who can answer four questions with a system, not a vibe." as="h2" className="slide-title font-semibold tracking-tight mb-10" />
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
              defaultSrc="/decks/brand/04-what-good.jpg"
              defaultAlt="Composed founder presenting an open brand guidelines book to a small attentive group at a round table"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "deliverables-overview",
    title: `The ${TOTAL_DELIVS} deliverables`,
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(5)}>
        <div className="grid grid-cols-12 gap-10 items-center">
          <div className="col-span-7">
            <SlotText slideId="deliverables-overview" field="kicker" defaultValue="What you walk out with" as="div" className="slide-kicker font-semibold text-primary mb-6" />
            <SlotText slideId="deliverables-overview" field="title" defaultValue={`${TOTAL_DELIVS} founder-ready deliverables — built for your startup.`} as="h2" className="slide-title font-semibold tracking-tight mb-10" />
            <div className="grid grid-cols-1 gap-4">
              {STAGE.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-5 rounded-2xl border bg-card p-6">
                    <div className="rounded-2xl bg-primary/10 p-4 shrink-0">
                      <Icon className="text-primary" style={{ width: 40, height: 40 }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="slide-caption text-muted-foreground font-medium">{String(i + 1).padStart(2, "0")}</div>
                      <SlotText slideId="deliverables-overview" field={`item.${i}.title`} defaultValue={item.title} as="div" className="slide-body-lg font-semibold tracking-tight" />
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
              defaultSrc="/decks/brand/05-deliverables.jpg"
              defaultAlt="Calm craftsperson arranging five brand artifacts as a still life on a workbench"
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
      const next = FRAMEWORK_STAGES[6];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(TOTAL_SLIDES)} variant="dark">
          <div className="grid grid-cols-12 gap-10 items-center">
            <div className="col-span-7">
              <SlotText slideId="recap" field="kicker" defaultValue="Recap · what's next" as="div" className="slide-kicker font-semibold text-white/60 mb-8" />
              <SlotText slideId="recap" field="title" defaultValue="Brand is the multiplier on everything else you've built." as="h2" className="slide-title font-semibold tracking-tight" />
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
                defaultSrc="/decks/brand/11-recap.jpg"
                defaultAlt="Composed founder walking forward at dawn carrying a tied folio and a small megaphone toward an open avenue"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
