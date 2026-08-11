import { cn } from "@/lib/utils";
import { artOf } from "@/lib/ops-art";

/**
 * Drawn category marks for the operating runway. Thin-stroke line art in the
 * same drafting language as the framework stage sketches — never filled icons,
 * never emoji. Colour comes from the category art map or the parent.
 */

type Props = {
  category?: string | null;
  className?: string;
  /** Draw the mark inside a tinted, ringed plate. */
  plate?: boolean;
  /** Plate size classes when `plate` is on. */
  plateClassName?: string;
  title?: string;
};

function Mark({ category }: { category?: string | null }) {
  switch (category) {
    // Foundation — stacked slabs on a base line
    case "Foundation":
      return (
        <>
          <path d="M4 19h16" />
          <rect x="6.5" y="14.5" width="11" height="3" rx="1" />
          <rect x="8" y="10.5" width="8" height="3" rx="1" />
          <rect x="10" y="6.5" width="4" height="3" rx="1" />
        </>
      );

    // Strategy — routes converging on a target
    case "Strategy":
      return (
        <>
          <path d="M3 6c4 0 6 4 9 5.6" />
          <path d="M3 18c4 0 6-4 9-5.6" />
          <circle cx="17" cy="12" r="4.2" />
          <circle cx="17" cy="12" r="1.2" />
        </>
      );

    // Operations — a running gear ring with a turning square
    case "Operations":
      return (
        <>
          <circle cx="12" cy="12" r="8" strokeDasharray="2 3.2" />
          <circle cx="12" cy="12" r="4.8" />
          <rect x="10" y="10" width="4" height="4" rx="0.8" />
        </>
      );

    // Finance — columns and a trend
    case "Finance":
      return (
        <>
          <path d="M4 19h16" />
          <path d="M6.5 19v-4" />
          <path d="M11 19v-7" />
          <path d="M15.5 19v-3" />
          <path d="M6 10.5 10.5 7 14 9.5 19.5 4.5" />
        </>
      );

    // Governance — a sealed document
    case "Governance":
      return (
        <>
          <path d="M6 3.5h7.5L18 8v9.5" />
          <path d="M13 3.5V8h5" />
          <path d="M6 3.5V17a3.5 3.5 0 0 0 3.5 3.5H18" />
          <circle cx="14.5" cy="15" r="2.6" />
        </>
      );

    // Brand — a mark inside its clear-space frame
    case "Brand":
      return (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" strokeDasharray="2.5 3" />
          <path d="M12 8.2c1.6 1.3 3.4 2.2 3.4 4.2A3.4 3.4 0 0 1 12 15.8a3.4 3.4 0 0 1-3.4-3.4c0-2 1.8-2.9 3.4-4.2Z" />
        </>
      );

    // Marketing — a funnel with demand falling through
    case "Marketing":
      return (
        <>
          <path d="M3.5 5h17l-6.4 7.2V20L10 17.5v-5.3L3.5 5Z" />
          <path d="M8 2.5v1.2" />
          <path d="M16 2.5v1.2" />
        </>
      );

    // Social & Content — a published post with a rhythm
    case "Social & Content":
      return (
        <>
          <rect x="3.5" y="4.5" width="17" height="12" rx="2.5" />
          <path d="M7 20h10" />
          <path d="M7 9.5h6" />
          <path d="M7 12.8h9" />
        </>
      );

    // Creative — a graded frame with a lifting spark
    case "Creative":
      return (
        <>
          <rect x="3.5" y="6.5" width="13" height="11" rx="2" />
          <path d="M4.5 15.5 8.5 11l3.4 3.2L14.5 12l2 1.9" />
          <path d="M19 3.2v4.4M16.8 5.4h4.4" />
        </>
      );

    // Anything unmapped — a neutral node
    default:
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M8.8 12.2l2.2 2.2 4.2-4.6" />
        </>
      );
  }
}

export function OpsGlyph({ category, className, plate, plateClassName, title }: Props) {
  const art = artOf(category);
  const svg = (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title ?? category ?? "Step"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("opsglyph", plate ? "h-[55%] w-[55%]" : cn("h-4 w-4", art.ink), className)}
    >
      <Mark category={category} />
    </svg>
  );

  if (!plate) return svg;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl ring-1",
        art.plate, art.ring, art.ink,
        plateClassName ?? "h-9 w-9",
      )}
    >
      {svg}
    </span>
  );
}

export default OpsGlyph;
