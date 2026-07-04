import type { FrameworkDeliverable } from "@/lib/framework-deliverables";
import type { DeliverableDetail } from "@/lib/workshop-productization";
import { SlideLayout } from "./SlideLayout";
import { SlotImage } from "./slots";
import { Wrench, ArrowDownToLine, Sparkles } from "lucide-react";

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
  /**
   * Optional productization overlay — the build mechanic, prior-stage inputs,
   * and the one-line takeaway a founder can say when they leave.
   * Omitted on Foundation, which is drafted live without a generator.
   */
  detail?: DeliverableDetail;
};

/**
 * Reusable "one slide per deliverable" template.
 * When `detail` is provided, the slide gains three "build/inputs/takeaway"
 * cards under the tooltip so post-Foundation stages feel productized.
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
  detail,
}: Props) {
  const Icon = deliverable.icon;
  return (
    <SlideLayout stageKicker={stageKicker} pageLabel={pageLabel} variant={variant}>
      <div className="grid grid-cols-12 gap-10 items-start">
        <div className={detail ? "col-span-8" : "col-span-7"}>
          <div className="slide-kicker font-semibold text-primary mb-6">
            Deliverable {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <h2 className="slide-title font-semibold tracking-tight">{deliverable.title}</h2>
          <p className={`slide-body-lg mt-8 max-w-[850px] ${variant === "dark" ? "text-white/80" : "text-muted-foreground"}`}>
            {deliverable.tooltip}
          </p>

          {detail && (
            <div className="mt-8 grid grid-cols-1 gap-3">
              <div className="rounded-2xl border bg-card p-4 flex items-start gap-4">
                <Wrench className="text-primary shrink-0 mt-1" style={{ width: 24, height: 24 }} />
                <div>
                  <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-1">
                    Build mechanic
                  </div>
                  <div className="slide-body">{detail.buildMechanic}</div>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 flex items-start gap-4">
                <ArrowDownToLine className="text-primary shrink-0 mt-1" style={{ width: 24, height: 24 }} />
                <div>
                  <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-1">
                    Inherits from
                  </div>
                  <div className="slide-body">{detail.inputs.join(" · ")}</div>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex items-start gap-4">
                <Sparkles className="text-primary shrink-0 mt-1" style={{ width: 24, height: 24 }} />
                <div>
                  <div className="slide-caption font-semibold uppercase tracking-wider text-primary mb-1">
                    What you can say Monday
                  </div>
                  <div className="slide-body font-medium">{detail.takeaway}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={`${detail ? "col-span-4" : "col-span-5"} flex items-center justify-center`}>
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
