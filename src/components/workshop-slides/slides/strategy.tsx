import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { STAGE_PRODUCTIZATION } from "@/lib/workshop-productization";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
import { buildProductizationSlides } from "../ProductizationSlides";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[1]; // Strategy
const PROD = STAGE_PRODUCTIZATION["strategy"];
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;
// 5 overview + 4 productization + N per-deliverable + 1 recap
const TOTAL_SLIDES = 5 + 4 + TOTAL_DELIVS + 1;

const pl = (i: number) => `${i} / ${TOTAL_SLIDES}`;

const STAGE_BREAKS = [
  {
    title: "Marketing becomes a money pit.",
    body: "Without a sized market and a sharp buyer, every ad, email, and post is a guess — and the bill arrives on the first of every month.",
  },
  {
    title: "You compete on price by default.",
    body: "When you can't name the wedge only you own, customers default to the cheapest option — and you race competitors to the bottom.",
  },
  {
    title: "The first ninety days drift.",
    body: "No GTM sequence means launch week becomes launch quarter — momentum fades and the team loses faith before traction shows up.",
  },
];

const STAGE_QUESTIONS = [
  "How big is the real opportunity in your city and price band?",
  "Who exactly is the buyer — and what triggers their purchase?",
  "What wedge do you own that competitors can't copy?",
  "What's your first ninety days, move by move?",
];

const DELIV_IMAGES = [
  { src: "/decks/strategy/06-deliv-1.jpg", alt: "Cheerful surveyor mapping a hillside neighborhood" },
  { src: "/decks/strategy/07-deliv-2.jpg", alt: "Friendly artist sketching warm portraits of three smiling customers" },
  { src: "/decks/strategy/08-deliv-3.jpg", alt: "Delighted chess player planting a flag on a single square" },
  { src: "/decks/strategy/09-deliv-4.jpg", alt: "Eager runner at sunrise starting blocks with a map" },
  { src: "/decks/strategy/10-deliv-5.jpg", alt: "Smiling conductor leading a small choir singing in unison" },
];

export const strategySlides: Slide[] = [
  // 1. Cover
  {
    id: "cover",
    title: "Strategy — Cover",
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
            defaultValue="Strategy."
            as="h1"
            className="slide-title-lg font-semibold tracking-tight"
          />
          <SlotText
            slideId="cover"
            field="subtitle"
            defaultValue="How you win — and how you compound the lead. Strategy turns Foundation's truth into the moves that put real customers on the calendar."
            as="p"
            className="slide-subtitle mt-10 text-white/80 max-w-[1200px]"
          />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/strategy/01-cover.jpg"
            defaultAlt="Smiling strategist arranging chess pieces over a city map"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },

  // 2. The stakes
  {
    id: "stakes",
    title: "Why Strategy exists",
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
              defaultValue="Strategy is how a small budget beats a bigger one — and how a clear wedge beats a loud competitor."
            />
          </h2>
          <SlotText
            slideId="stakes"
            field="body"
            defaultValue="Nail this stage and every dollar of marketing, every sales call, every hire compounds. Skip it and you'll work twice as hard for half the traction."
            as="p"
            className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]"
          />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/strategy/02-stakes.jpg"
            defaultAlt="Cheerful general happily moving figures across a strategy board"
            className="mt-10 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },

  // 3. What breaks without it
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
              defaultValue="Three expensive mistakes Strategy prevents."
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
              defaultSrc="/decks/strategy/03-what-breaks.jpg"
              defaultAlt="Three small vignettes showing strategy pitfalls with hopeful characters"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
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
              defaultValue="A founder who can answer four questions with real numbers and a real plan."
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-4">
              {STAGE_QUESTIONS.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-5 rounded-2xl bg-primary/5 border border-primary/15 p-6"
                >
                  <CheckCircle2
                    className="text-primary shrink-0 mt-1"
                    style={{ width: 36, height: 36 }}
                  />
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
              defaultSrc="/decks/strategy/04-what-good.jpg"
              defaultAlt="Founder beaming while four delighted customers lean in to listen"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },

  // 5. The deliverables overview
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
              defaultSrc="/decks/strategy/05-deliverables.jpg"
              defaultAlt="Craftsman smiling over five strategy instruments laid on linen"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },

  // 6..(5+N) — one slide per deliverable
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

  // Final — Recap + what's next
  {
    id: "recap",
    title: "Recap — what's next",
    render: () => {
      const next = FRAMEWORK_STAGES[2];
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
                defaultValue="Strategy turns truth into traction."
                as="h2"
                className="slide-title font-semibold tracking-tight"
              />
              <p className="slide-subtitle mt-8 text-white/80">
                Next up — <span className="text-primary font-semibold">{next.number} {next.name}</span>:{" "}
                {next.intro.toLowerCase()}
              </p>
              <div className="mt-12 inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-primary text-primary-foreground slide-body-lg font-semibold">
                <SlotText
                  slideId="recap"
                  field="cta"
                  defaultValue={`Open the ${next.name} deck`}
                />
                <ArrowRight style={{ width: 36, height: 36 }} />
              </div>
            </div>
            <div className="col-span-5 flex items-center justify-center">
              <SlotImage
                slideId="recap"
                field="image"
                defaultSrc="/decks/strategy/11-recap.jpg"
                defaultAlt="Two cheerful hikers at a vista pointing eagerly toward sunlit hills"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
