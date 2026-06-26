import { FRAMEWORK_STAGES, FOUNDATION_FIRST_REASONS } from "@/lib/framework-deliverables";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
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
            defaultValue="Foundation."
            as="h1"
            className="slide-title-lg font-semibold tracking-tight"
          />
          <SlotText
            slideId="cover"
            field="subtitle"
            defaultValue="The bedrock every defensible startup is built on. Get this right and everything downstream gets easier, sharper, faster."
            as="p"
            className="slide-subtitle mt-10 text-white/80 max-w-[1200px]"
          />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/foundation/01-cover.jpg"
            defaultAlt="Founder sketching a foundation blueprint at a drafting table"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
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
              defaultValue="Everything downstream — your brand, your site, your pitch, your pricing — inherits whatever you decide here."
            />
          </h2>
          <SlotText
            slideId="stakes"
            field="body"
            defaultValue="Skip Foundation and you'll pay for it later in redos, refunds, and ad spend that doesn't convert."
            as="p"
            className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]"
          />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/foundation/02-stakes.jpg"
            defaultAlt="A small house being lowered onto a single concrete footing"
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
      <SlideLayout stageKicker={KICKER} pageLabel={pl(3, 10)}>
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
              defaultValue="Three expensive mistakes Foundation prevents."
              as="h2"
              className="slide-title font-semibold tracking-tight mb-10"
            />
            <div className="grid grid-cols-1 gap-5">
              {FOUNDATION_FIRST_REASONS.map((r, i) => (
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
              defaultSrc="/decks/foundation/03-what-breaks.jpg"
              defaultAlt="Three precarious towers of mismatched objects on uneven ground"
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
    render: () => {
      const defaults = [
        "Who exactly do you serve?",
        "What painful problem do you solve?",
        "Why now — and why you?",
        "Why pick you over every alternative?",
      ];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(4, 10)}>
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
                defaultValue="A founder who can answer four questions in plain language."
                as="h2"
                className="slide-title font-semibold tracking-tight mb-10"
              />
              <div className="grid grid-cols-1 gap-4">
                {defaults.map((q, i) => (
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
                defaultSrc="/decks/foundation/04-what-good.jpg"
                defaultAlt="A founder calmly answering four curious customers at a cafe table"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },

  // 5. The four deliverables
  {
    id: "deliverables-overview",
    title: "The four deliverables",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(5, 10)}>
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
              defaultValue="Four founder-ready deliverables — built for your startup."
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
              defaultSrc="/decks/foundation/05-deliverables.jpg"
              defaultAlt="Four hand tools neatly arranged on a craftsman's workbench"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },

  // 6-9. One slide per deliverable
  ...STAGE.items.map((item, i) => {
    const delivImages = [
      { src: "/decks/foundation/06-deliv-1.jpg", alt: "Tailor measuring a founder for a bespoke jacket" },
      { src: "/decks/foundation/07-deliv-2.jpg", alt: "Gardener transplanting a young sapling into rich soil" },
      { src: "/decks/foundation/08-deliv-3.jpg", alt: "Lighthouse keeper aiming a beam at one small boat" },
      { src: "/decks/foundation/09-deliv-4.jpg", alt: "Chess player placing one piece on an empty board" },
    ];
    const art = delivImages[i];
    return {
      id: `deliv-${i}`,
      title: item.title,
      render: () => (
        <DeliverableSlide
          stageKicker={KICKER}
          pageLabel={pl(6 + i, 10)}
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

  // 10. Recap + what's next
  {
    id: "recap",
    title: "Recap — what's next",
    render: () => {
      const next = FRAMEWORK_STAGES[1];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(10, 10)} variant="dark">
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
                defaultValue="Foundation locks the truth."
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
                defaultSrc="/decks/foundation/10-recap.jpg"
                defaultAlt="Hiker pausing at a trail marker looking up a winding path into distant hills"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
