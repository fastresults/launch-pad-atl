import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { STAGE_PRODUCTIZATION } from "@/lib/workshop-productization";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
import { buildProductizationSlides, mentoredSessionSlide } from "../ProductizationSlides";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[2]; // Operations
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const PROD = STAGE_PRODUCTIZATION["operations"];
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;
// 5 overview + 1 mentored-session + 4 productization + N per-deliverable + 1 recap
const TOTAL_SLIDES = 6 + 4 + TOTAL_DELIVS + 1;

const pl = (i: number) => `${i} / ${TOTAL_SLIDES}`;

const STAGE_BREAKS = [
  {
    title: "Every order is a fire drill.",
    body: "Without a repeatable workflow, the founder becomes the bottleneck — quality slips, hours disappear, and growth stalls the day you can't take another call.",
  },
  {
    title: "You can't hire your way out.",
    body: "Nothing is documented, so a new teammate has to be retrained from scratch. The promise of leverage turns into more meetings and lower margin.",
  },
  {
    title: "Sales and marketing leak money.",
    body: "No playbook, no channel math — deals close on luck and ad spend goes into a black box. You scale chaos instead of compounding what works.",
  },
];

const STAGE_QUESTIONS = [
  "What are you shipping in the next ninety days — and in what order?",
  "Can someone other than you run a week of operations without breaking it?",
  "Do you have a repeatable sales motion that closes without discounting?",
  "Do you know which marketing dollar earns the next dollar back?",
];

const DELIV_IMAGES = [
  { src: "/decks/operations/06-deliv-1.jpg", alt: "Smiling planner placing small flags on a large wall map" },
  { src: "/decks/operations/07-deliv-2.jpg", alt: "Cheerful clockmaker fitting a gear into a precise mechanism" },
  { src: "/decks/operations/08-deliv-3.jpg", alt: "Warm handshake across a desk between smiling people" },
  { src: "/decks/operations/09-deliv-4.jpg", alt: "Cheerful marketer turning a brass tap into a filling bucket" },
];

export const operationsSlides: Slide[] = [
  {
    id: "cover",
    title: "Operations — Cover",
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
            defaultValue="Operations."
            as="h1"
            className="slide-title-lg font-semibold tracking-tight"
          />
          <SlotText
            slideId="cover"
            field="subtitle"
            defaultValue="What you build, sell, and ship — week after week. Operations turns Strategy's plan into a machine that runs without burning the founder out."
            as="p"
            className="slide-subtitle mt-10 text-white/80 max-w-[1200px]"
          />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/operations/01-cover.jpg"
            defaultAlt="Cheerful workshop foreman organizing crates in a tidy studio"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "stakes",
    title: "Why Operations exists",
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
              defaultValue="Operations is how a clever plan becomes a real, repeatable business — instead of a heroic effort that ends with the founder."
            />
          </h2>
          <SlotText
            slideId="stakes"
            field="body"
            defaultValue="Get this stage right and every week ships more product, closes more deals, and earns more trust with less drama. Skip it and the business lives and dies inside your inbox."
            as="p"
            className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]"
          />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/operations/02-stakes.jpg"
            defaultAlt="Beaming engineer pulling a tall lever to set a machine in motion"
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
              defaultValue="Three expensive mistakes Operations prevents."
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
              defaultSrc="/decks/operations/03-what-breaks.jpg"
              defaultAlt="Three small vignettes showing operations problems with hopeful characters"
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
              defaultValue="A founder who can answer four questions with a roadmap, a workflow, and a number."
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
              defaultSrc="/decks/operations/04-what-good.jpg"
              defaultAlt="Beaming founder presenting a wall of color-coded planning cards to smiling teammates"
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
              defaultSrc="/decks/operations/05-deliverables.jpg"
              defaultAlt="Craftsman smiling over four operations tools on a workbench"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  // Productization slides (Build tool · Live worksheet · Ship-ready artifact · Take-home kit)
  mentoredSessionSlide("operations", KICKER, PROD, pl),
  ...buildProductizationSlides("operations", KICKER, PROD, pl, FRAMEWORK_STAGES[3]?.name),

  ...STAGE.items.map((item, i) => {
    const art = DELIV_IMAGES[i];
    return {
      id: `deliv-${i}`,
      title: item.title,
      render: () => (
        <DeliverableSlide
          stageKicker={KICKER}
          pageLabel={pl(11 + i)}
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
      const next = FRAMEWORK_STAGES[3];
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
                defaultValue="Operations is how strategy stops being a deck and starts being a business."
                as="h2"
                className="slide-title font-semibold tracking-tight"
              />
              <p className="slide-subtitle mt-8 text-white/80">
                Next up — <span className="text-primary font-semibold">{next.number} {next.name}</span>{" "}
                : {next.intro.toLowerCase()}
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
                defaultSrc="/decks/operations/10-recap.jpg"
                defaultAlt="Two cheerful relay runners passing a baton on a sunlit track"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
