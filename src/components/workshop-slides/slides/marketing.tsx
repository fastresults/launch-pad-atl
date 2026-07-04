import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { STAGE_PRODUCTIZATION } from "@/lib/workshop-productization";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { DeliverableSlide } from "../DeliverableSlide";
import { SlotText, SlotImage } from "../slots";
import { buildProductizationSlides } from "../ProductizationSlides";
import type { Slide } from "../SlideDeck";

const STAGE = FRAMEWORK_STAGES[6]; // Marketing
const KICKER = `${STAGE.number} · ${STAGE.name.toUpperCase()}`;
const PROD = STAGE_PRODUCTIZATION["marketing"];
const TOTAL_STAGES = FRAMEWORK_STAGES.length;
const TOTAL_DELIVS = STAGE.items.length;
// 5 overview + 4 productization + N per-deliverable + 1 recap
const TOTAL_SLIDES = 5 + 4 + TOTAL_DELIVS + 1;

const pl = (i: number) => `${i} / ${TOTAL_SLIDES}`;

const STAGE_BREAKS = [
  {
    title: "Twenty thousand for a website that doesn't sell.",
    body: "Agencies bill for design rounds and project managers — and you launch a brochure, not a revenue engine. Most founders pay the price twice before learning.",
  },
  {
    title: "Months of waiting, then a relaunch.",
    body: "Without a tight PRD, scope drifts, deadlines slide, and the site ships outdated. Real customers wait while you wait for one more revision.",
  },
  {
    title: "An AI builder that wastes a weekend.",
    body: "Without a clear prompt — pages, copy, CTAs — the tools hallucinate sections, mismatch your brand, and produce a site you'll rewrite by Monday anyway.",
  },
];

const STAGE_QUESTIONS = [
  "Can you brief a website in one document a builder could ship from?",
  "Do every page and CTA map back to your offer and buyer?",
  "Will the copy sound like your brand on day one — not after rewrites?",
  "Can you launch a revenue-ready site in a weekend, not a quarter?",
];

const DELIV_IMAGES = [
  { src: "/decks/marketing/06-deliv-1.jpg", alt: "Pleased founder at a kitchen table sliding a single thick brief into a laptop while a neat little website emerges as architectural paper layers" },
];

export const marketingSlides: Slide[] = [
  {
    id: "cover",
    title: "Marketing — Cover",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(1)} variant="dark">
        <div className="max-w-[1400px]">
          <SlotText slideId="cover" field="kicker" defaultValue={`Stage ${STAGE.number} of ${String(TOTAL_STAGES).padStart(2, "0")}`} as="div" className="slide-kicker font-semibold text-white/60 mb-10" />
          <SlotText slideId="cover" field="title" defaultValue="Marketing." as="h1" className="slide-title-lg font-semibold tracking-tight" />
          <SlotText slideId="cover" field="subtitle" defaultValue="The AI-builder prompt that ships your site in a weekend. Marketing turns your brand into a place a customer can actually buy." as="p" className="slide-subtitle mt-10 text-white/80 max-w-[1200px]" />
          <SlotImage
            slideId="cover"
            field="image"
            defaultSrc="/decks/marketing/01-cover.jpg"
            defaultAlt="Pleased founder at a desk with an open laptop wireframe and a chalkboard easel showing simple page diagrams"
            className="mt-12 max-h-[420px] rounded-2xl"
          />
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "stakes",
    title: "Why Marketing exists",
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(2)}>
        <div className="max-w-[1500px]">
          <SlotText slideId="stakes" field="kicker" defaultValue="Why this stage exists" as="div" className="slide-kicker font-semibold text-primary mb-8" />
          <h2 className="slide-title font-semibold tracking-tight">
            <SlotText slideId="stakes" field="title" defaultValue="A site is no longer a six-month project — it's a weekend, if you write the brief like a pro." />
          </h2>
          <SlotText slideId="stakes" field="body" defaultValue="Get this right and you launch a real, revenue-ready website without an agency invoice. Skip it and AI builders will gladly waste your weekend with a beautiful page that converts no one." as="p" className="slide-body-lg mt-10 text-muted-foreground max-w-[1300px]" />
          <SlotImage
            slideId="stakes"
            field="image"
            defaultSrc="/decks/marketing/02-stakes.jpg"
            defaultAlt="Split scene: weary founder holding an enormous invoice beside an agency tower, opposite a calm founder typing while a tidy website rises next to them"
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
            <SlotText slideId="what-breaks" field="title" defaultValue="Three expensive mistakes a real Website PRD prevents." as="h2" className="slide-title font-semibold tracking-tight mb-10" />
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
              defaultSrc="/decks/marketing/03-what-breaks.jpg"
              defaultAlt="Three vignettes: a clipboard with horizontal line marks, a desk calendar shedding pages, and a laptop emitting a tangle of mismatched page shapes"
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
            <SlotText slideId="what-good" field="title" defaultValue="A founder who can answer four questions with a single document a builder ships from." as="h2" className="slide-title font-semibold tracking-tight mb-10" />
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
              defaultSrc="/decks/marketing/04-what-good.jpg"
              defaultAlt="Pleased founder handing a single neat folio across a desk to a friendly builder-robot assembling a small website from paper blocks"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  {
    id: "deliverables-overview",
    title: `The ${TOTAL_DELIVS} startup asset${TOTAL_DELIVS === 1 ? "" : "s"}`,
    render: () => (
      <SlideLayout stageKicker={KICKER} pageLabel={pl(5)}>
        <div className="grid grid-cols-12 gap-10 items-center">
          <div className="col-span-7">
            <SlotText slideId="deliverables-overview" field="kicker" defaultValue="What you walk out with" as="div" className="slide-kicker font-semibold text-primary mb-6" />
            <SlotText slideId="deliverables-overview" field="title" defaultValue={`${TOTAL_DELIVS} founder-ready deliverable${TOTAL_DELIVS === 1 ? "" : "s"} — built for your startup.`} as="h2" className="slide-title font-semibold tracking-tight mb-10" />
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
              defaultSrc="/decks/marketing/05-deliverables.jpg"
              defaultAlt="Editorial still life on a warm wooden desk: a bound document with a ribbon bookmark, a fountain pen, a laptop showing a wireframe and a steaming coffee cup"
              className="w-full max-h-[760px] object-contain rounded-2xl"
            />
          </div>
        </div>
      </SlideLayout>
    ),
  },
  // Productization slides (Build tool · Live worksheet · Ship-ready artifact · Take-home kit)
  ...buildProductizationSlides("marketing", KICKER, PROD, pl, FRAMEWORK_STAGES[7]?.name),

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
      const next = FRAMEWORK_STAGES[7];
      return (
        <SlideLayout stageKicker={KICKER} pageLabel={pl(TOTAL_SLIDES)} variant="dark">
          <div className="grid grid-cols-12 gap-10 items-center">
            <div className="col-span-7">
              <SlotText slideId="recap" field="kicker" defaultValue="Recap · what's next" as="div" className="slide-kicker font-semibold text-white/60 mb-8" />
              <SlotText slideId="recap" field="title" defaultValue="A revenue-ready website is no longer a six-month project — it's a weekend with the right brief." as="h2" className="slide-title font-semibold tracking-tight" />
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
                defaultSrc="/decks/marketing/07-recap.jpg"
                defaultAlt="Pleased founder walking down a sunlit avenue toward a glowing storefront window framing a small tidy website wireframe"
                className="w-full max-h-[760px] object-contain rounded-2xl"
              />
            </div>
          </div>
        </SlideLayout>
      );
    },
  },
];
