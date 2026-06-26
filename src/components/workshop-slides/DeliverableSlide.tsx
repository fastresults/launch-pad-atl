import type { FrameworkDeliverable } from "@/lib/framework-deliverables";
import { SlideLayout } from "./SlideLayout";
import { SlotImage } from "./slots";

type Props = {
  stageKicker: string;
  pageLabel: string;
  index: number; // 1-based within stage
  total: number;
  deliverable: FrameworkDeliverable;
  variant?: "light" | "dark";
  /** Slide id used for the image slot — must be unique within the deck. */
  slideId?: string;
  /** Default illustration src (New Yorker–style art). Falls back to the deliverable icon. */
  imageSrc?: string;
  imageAlt?: string;
};

/**
 * Reusable "one slide per deliverable" template.
 * Reads icon + title + tooltip from FRAMEWORK_STAGES so the other 7 stages
 * inherit this layout for free.
 */
export function DeliverableSlide({
  stageKicker,
  pageLabel,
  index,
  total,
  deliverable,
  variant = "light",
  slideId,
  imageSrc,
  imageAlt,
}: Props) {
  const Icon = deliverable.icon;
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel} variant={variant}>
      <div className="grid grid-cols-12 gap-12 items-center">
        <div className="col-span-7">
          <div className="slide-kicker font-semibold text-primary mb-6">
            Deliverable {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <h2 className="slide-title font-semibold tracking-tight">{deliverable.title}</h2>
          <p className="slide-body-lg mt-10 max-w-[850px] text-muted-foreground">
            {deliverable.tooltip}
          </p>
        </div>
        <div className="col-span-5 flex items-center justify-center">
          {imageSrc && slideId ? (
            <SlotImage
              slideId={slideId}
              field="image"
              defaultSrc={imageSrc}
              defaultAlt={imageAlt ?? deliverable.title}
              className="max-h-[640px] w-full object-contain rounded-2xl"
            />
          ) : (
            <div className="rounded-[48px] bg-primary/10 ring-1 ring-primary/20 p-20">
              <Icon className="text-primary" style={{ width: 280, height: 280 }} strokeWidth={1.25} />
            </div>
          )}
        </div>
      </div>
    </SlideLayout>
  );
}
