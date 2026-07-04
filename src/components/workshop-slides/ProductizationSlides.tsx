import { Wrench, Sparkles, FileText, Package, ArrowRight, Users, Eye, Lightbulb } from "lucide-react";
import { SlideLayout } from "./SlideLayout";
import type { Slide } from "./SlideDeck";
import type { StageProductization } from "@/lib/workshop-productization";

type Ctx = { stageKicker: string; pageLabel: (n: number) => string; startPage: number };

function MentoredSessionSlide({
  stageKicker,
  pageLabel,
  data,
}: { stageKicker: string; pageLabel: (n: number) => string; data: StageProductization }) {
  const perspective = data.perspective ?? "Expert perspective applied live to your specific startup.";
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel(6)}>
      <div className="max-w-[1600px]">
        <div className="slide-kicker font-semibold text-primary mb-6 inline-flex items-center gap-3">
          <Users style={{ width: 24, height: 24 }} /> How this session works
        </div>
        <h2 className="slide-title font-semibold tracking-tight mb-4">
          A mentored working session — not a lecture, not a done-for-you deliverable.
        </h2>
        <p className="slide-body-lg text-muted-foreground max-w-[1300px] mb-10">
          {perspective}
        </p>
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
            <div className="rounded-xl bg-primary/10 p-3 inline-flex mb-4">
              <FileText className="text-primary" style={{ width: 28, height: 28 }} strokeWidth={1.5} />
            </div>
            <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-2">
              What you bring
            </div>
            <p className="slide-body">
              Your Foundation drafts and a real working attempt at this stage's questions — however rough.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/10 p-6">
            <div className="rounded-xl bg-primary/20 p-3 inline-flex mb-4">
              <Eye className="text-primary" style={{ width: 28, height: 28 }} strokeWidth={1.5} />
            </div>
            <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-2">
              What happens in the room
            </div>
            <p className="slide-body">
              Live review, targeted questions, redirection, and pattern-matching against other startups — applied to <em>your</em> context.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
            <div className="rounded-xl bg-primary/10 p-3 inline-flex mb-4">
              <Lightbulb className="text-primary" style={{ width: 28, height: 28 }} strokeWidth={1.5} />
            </div>
            <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-2">
              What you leave with
            </div>
            <p className="slide-body">
              A sharper version of your own thinking, plus a working artifact on your dashboard you continue to refine.
            </p>
          </div>
        </div>
        <p className="slide-caption text-muted-foreground mt-6 italic">
          Foundation is the only stage that is pure drafting. Every stage after Foundation is a mentored review of your work.
        </p>
      </div>
    </SlideLayout>
  );
}

function BuildToolSlide({
  stageKicker,
  pageLabel,
  startPage,
  data,
}: Ctx & { data: StageProductization }) {
  const { signatureBuild } = data;
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel(startPage)}>
      <div className="grid grid-cols-12 gap-10 items-start">
        <div className="col-span-7">
          <div className="slide-kicker font-semibold text-primary mb-6 inline-flex items-center gap-3">
            <Wrench style={{ width: 24, height: 24 }} /> In-room working exercise
          </div>
          <h2 className="slide-title font-semibold tracking-tight mb-6">{signatureBuild.title}</h2>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-semibold text-primary mb-8">
            {signatureBuild.duration}
          </div>
          <p className="slide-body-lg text-muted-foreground max-w-[900px]">
            {signatureBuild.mechanic}
          </p>
        </div>
        <div className="col-span-5">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
            <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-4">
              What you bring in
            </div>
            <ul className="space-y-3">
              {signatureBuild.inputs.map((input, i) => (
                <li key={i} className="flex gap-3 slide-body">
                  <span className="text-primary font-bold">{String(i + 1).padStart(2, "0")}</span>
                  <span>{input}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

function LiveWorksheetSlide({
  stageKicker,
  pageLabel,
  startPage,
  data,
}: Ctx & { data: StageProductization }) {
  const { liveWorksheet } = data;
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel(startPage + 1)}>
      <div className="max-w-[1500px]">
        <div className="slide-kicker font-semibold text-primary mb-6 inline-flex items-center gap-3">
          <Sparkles style={{ width: 24, height: 24 }} /> How the review runs
        </div>
        <h2 className="slide-title font-semibold tracking-tight mb-10">{liveWorksheet.headline}</h2>
        <ol className="space-y-4">
          {liveWorksheet.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-5 rounded-2xl border bg-card p-6"
            >
              <div className="rounded-2xl bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center" style={{ width: 60, height: 60 }}>
                <span className="text-primary font-bold slide-body-lg">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="slide-body-lg font-medium pt-3">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </SlideLayout>
  );
}

function ArtifactPreviewSlide({
  stageKicker,
  pageLabel,
  startPage,
  data,
}: Ctx & { data: StageProductization }) {
  const { shipReadyArtifact } = data;
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel(startPage + 2)}>
      <div className="grid grid-cols-12 gap-10 items-start">
        <div className="col-span-7">
          <div className="slide-kicker font-semibold text-primary mb-6 inline-flex items-center gap-3">
            <FileText style={{ width: 24, height: 24 }} /> Working artifact you leave with
          </div>
          <h2 className="slide-title font-semibold tracking-tight mb-6">
            {shipReadyArtifact.title}
          </h2>
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-semibold text-primary">
              {shipReadyArtifact.format}
            </span>
            <span className="rounded-full bg-muted border px-4 py-1.5 text-sm font-medium text-muted-foreground">
              {shipReadyArtifact.aiModel}
            </span>
          </div>
          <p className="slide-body-lg text-muted-foreground max-w-[900px]">
            {shipReadyArtifact.released}
          </p>
        </div>
        <div className="col-span-5">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-4">
              What's inside
            </div>
            <ul className="space-y-3">
              {shipReadyArtifact.contains.map((item, i) => (
                <li key={i} className="flex gap-3 slide-body">
                  <span className="text-primary shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

function TakeHomeKitSlide({
  stageKicker,
  pageLabel,
  startPage,
  data,
}: Ctx & { data: StageProductization; nextName?: string }) {
  const { takeHomeKit } = data;
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel(startPage + 3)}>
      <div className="max-w-[1600px]">
        <div className="slide-kicker font-semibold text-primary mb-6 inline-flex items-center gap-3">
          <Package style={{ width: 24, height: 24 }} /> Continue on your dashboard
        </div>
        <h2 className="slide-title font-semibold tracking-tight mb-10">{takeHomeKit.headline}</h2>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {takeHomeKit.files.map((f, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                <FileText className="text-primary" style={{ width: 28, height: 28 }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="slide-body font-semibold tracking-tight">{f.name}</div>
                <div className="slide-caption text-primary font-medium mt-0.5">{f.format}</div>
                <div className="slide-caption text-muted-foreground mt-1">{f.note}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 flex items-start gap-5">
          <ArrowRight className="text-primary shrink-0 mt-1" style={{ width: 36, height: 36 }} />
          <div>
            <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-2">
              Your Monday move
            </div>
            <p className="slide-body-lg font-medium">{takeHomeKit.mondayMove}</p>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

/** Mentored-session framing slide — inserted at position 6 in every post-Foundation deck. */
export function mentoredSessionSlide(
  slug: string,
  stageKicker: string,
  data: StageProductization,
  pageLabel: (n: number) => string,
): Slide {
  return {
    id: `${slug}-mentored-session`,
    title: "How this session works",
    render: () => <MentoredSessionSlide stageKicker={stageKicker} pageLabel={pageLabel} data={data} />,
  };
}

/**
 * Build the 4 productization slides that get inserted after the mentored-session
 * slide. Default startPage = 7 (i.e., 5 overview + 1 mentored-session + these 4).
 */
export function buildProductizationSlides(
  slug: string,
  stageKicker: string,
  data: StageProductization,
  pageLabel: (n: number) => string,
  nextName?: string,
  startPage = 7,
): Slide[] {
  const ctx: Ctx & { data: StageProductization } = { stageKicker, pageLabel, startPage, data };
  return [
    {
      id: `${slug}-build-tool`,
      title: "In-room working exercise",
      render: () => <BuildToolSlide {...ctx} />,
    },
    {
      id: `${slug}-live-worksheet`,
      title: "How the review runs",
      render: () => <LiveWorksheetSlide {...ctx} />,
    },
    {
      id: `${slug}-artifact`,
      title: "Working artifact",
      render: () => <ArtifactPreviewSlide {...ctx} />,
    },
    {
      id: `${slug}-take-home`,
      title: "Continue on dashboard",
      render: () => <TakeHomeKitSlide {...ctx} nextName={nextName} />,
    },
  ];
}
