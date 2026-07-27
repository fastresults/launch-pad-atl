// Hand-drawn, cross-hatched accent marks for each framework stage.
// Stroke-only SVG using currentColor so each sketch inherits the section's
// ink color. Purely decorative.

import { useId } from "react";

type Props = { stage: string; className?: string };

/** 45° hatch fill, clipped to a silhouette path. */
function Hatch({ clipId, spacing = 5 }: { clipId: string; spacing?: number }) {
  const lines = [];
  for (let x = -140; x < 200; x += spacing) {
    lines.push(<line key={x} x1={x} y1={-20} x2={x + 160} y2={140} />);
  }
  return (
    <g clipPath={`url(#${clipId})`} strokeWidth={0.55} opacity={0.5}>
      {lines}
    </g>
  );
}

function Sketch({ stage }: { stage: string }) {
  const uid = useId().replace(/[:]/g, "");
  const c = (n: string) => `${uid}-${n}`;

  switch (stage) {
    // 01 Foundation — laid cornerstone / stacked blocks
    case "01":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M22 78 L60 58 L98 78 L60 98 Z" />
            </clipPath>
            <clipPath id={c("b")}>
              <path d="M34 54 L60 41 L86 54 L60 67 Z" />
            </clipPath>
          </defs>
          <path d="M22 78 L60 58 L98 78 L60 98 Z" />
          <path d="M22 78 L22 86 L60 106 L98 86 L98 78" />
          <path d="M60 98 L60 106" />
          <path d="M34 54 L60 41 L86 54 L60 67 Z" />
          <path d="M34 54 L34 61 M86 54 L86 61 M60 67 L60 74" />
          <path d="M47 30 L60 23 L73 30 L60 37 Z" />
          <Hatch clipId={c("a")} spacing={5} />
          <Hatch clipId={c("b")} spacing={6} />
        </>
      );

    // 02 Strategy — compass rose
    case "02":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M60 20 L71 55 L60 60 Z" />
            </clipPath>
            <clipPath id={c("b")}>
              <path d="M60 100 L49 65 L60 60 Z" />
            </clipPath>
          </defs>
          <path d="M60 16 C36 16 17 36 17 60 C17 84 36 104 60 104 C84 104 103 84 103 60 C103 36 84 16 60 16 Z" />
          <path d="M60 24 C40 24 25 40 25 60 C25 80 40 96 60 96 C80 96 95 80 95 60 C95 40 80 24 60 24 Z" opacity={0.55} />
          <path d="M60 20 L71 55 L60 60 L49 65 L60 100 L71 65 L60 60 L49 55 Z" />
          <path d="M60 12 L60 18 M60 102 L60 108 M12 60 L18 60 M102 60 L108 60" />
          <Hatch clipId={c("a")} spacing={3.5} />
          <Hatch clipId={c("b")} spacing={3.5} />
        </>
      );

    // 03 Operations — meshed gears
    case "03":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M46 22 C31 22 20 34 20 48 C20 63 31 74 46 74 C60 74 72 63 72 48 C72 34 60 22 46 22 Z" />
            </clipPath>
          </defs>
          <path d="M46 22 C31 22 20 34 20 48 C20 63 31 74 46 74 C60 74 72 63 72 48 C72 34 60 22 46 22 Z" />
          <path d="M46 36 C39 36 34 42 34 48 C34 55 39 60 46 60 C53 60 58 55 58 48 C58 42 53 36 46 36 Z" />
          <path d="M46 16 L46 24 M46 72 L46 80 M14 48 L22 48 M70 48 L78 48 M24 26 L30 32 M62 64 L68 70 M68 26 L62 32 M30 64 L24 70" />
          <path d="M83 60 C73 60 66 68 66 77 C66 87 73 94 83 94 C92 94 100 87 100 77 C100 68 92 60 83 60 Z" />
          <path d="M83 70 C79 70 76 73 76 77 C76 81 79 84 83 84 C87 84 90 81 90 77 C90 73 87 70 83 70 Z" />
          <path d="M83 55 L83 62 M83 92 L83 99 M61 77 L68 77 M98 77 L105 77" />
          <path d="M20 104 L104 104" opacity={0.6} />
          <Hatch clipId={c("a")} spacing={5} />
        </>
      );

    // 04 Finance — coin stack with rising line
    case "04":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M26 84 L26 96 C26 101 42 105 56 105 C70 105 86 101 86 96 L86 84 Z" />
            </clipPath>
            <clipPath id={c("b")}>
              <path d="M26 68 L26 80 C26 85 42 89 56 89 C70 89 86 85 86 80 L86 68 Z" />
            </clipPath>
          </defs>
          <ellipse cx="56" cy="84" rx="30" ry="9" />
          <path d="M26 84 L26 96 C26 101 42 105 56 105 C70 105 86 101 86 96 L86 84" />
          <ellipse cx="56" cy="68" rx="30" ry="9" />
          <path d="M26 68 L26 80 C26 85 42 89 56 89 C70 89 86 85 86 80 L86 68" />
          <ellipse cx="56" cy="52" rx="30" ry="9" />
          <path d="M26 52 L26 64 C26 69 42 73 56 73 C70 73 86 69 86 64 L86 52" />
          <path d="M34 42 L52 26 L66 34 L92 12" opacity={0.75} />
          <path d="M80 11 L93 11 L93 24" opacity={0.75} />
          <Hatch clipId={c("a")} spacing={4} />
          <Hatch clipId={c("b")} spacing={4.5} />
        </>
      );

    // 05 Governance — shield with seal
    case "05":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M60 14 L98 28 C98 62 86 90 60 106 C34 90 22 62 22 28 Z" />
            </clipPath>
          </defs>
          <path d="M60 14 L98 28 C98 62 86 90 60 106 C34 90 22 62 22 28 Z" />
          <path d="M60 23 L90 34 C90 61 80 84 60 97 C40 84 30 61 30 34 Z" opacity={0.55} />
          <path d="M44 58 L55 70 L78 44" strokeWidth={1.6} />
          <Hatch clipId={c("a")} spacing={6} />
        </>
      );

    // 06 Brand — ink pot and nib
    case "06":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M28 72 L30 100 C30 104 40 107 52 107 C64 107 74 104 74 100 L76 72 Z" />
            </clipPath>
            <clipPath id={c("b")}>
              <path d="M96 14 L104 22 L70 60 L60 64 L64 54 Z" />
            </clipPath>
          </defs>
          <ellipse cx="52" cy="72" rx="24" ry="7" />
          <path d="M28 72 L30 100 C30 104 40 107 52 107 C64 107 74 104 74 100 L76 72" />
          <path d="M36 66 L36 60 C36 56 42 54 52 54 C62 54 68 56 68 60 L68 66" opacity={0.7} />
          <path d="M96 14 L104 22 L70 60 L60 64 L64 54 Z" />
          <path d="M64 54 L70 60" opacity={0.7} />
          <path d="M90 20 L98 28" opacity={0.7} />
          <Hatch clipId={c("a")} spacing={5} />
          <Hatch clipId={c("b")} spacing={3.5} />
        </>
      );

    // 07 Marketing — lit desk lamp (echoes the reference sketch)
    case "07":
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M62 34 L96 34 L86 62 L72 62 Z" />
            </clipPath>
            <clipPath id={c("b")}>
              <path d="M22 98 C22 92 34 88 48 88 C62 88 74 92 74 98 Z" />
            </clipPath>
          </defs>
          <path d="M22 98 C22 92 34 88 48 88 C62 88 74 92 74 98 Z" />
          <path d="M14 104 L86 104" />
          <path d="M48 88 L34 52 L60 30" strokeWidth={1.5} />
          <path d="M34 52 L28 50 M34 52 L40 54" opacity={0.6} />
          <circle cx="34" cy="52" r="3.5" />
          <circle cx="60" cy="30" r="3.5" />
          <path d="M62 34 L96 34 L86 62 L72 62 Z" />
          <path d="M72 62 L86 62" opacity={0.7} />
          <path d="M79 70 L79 80 M64 68 L58 78 M94 68 L100 78 M56 62 L46 66 M102 62 L112 66" opacity={0.65} />
          <Hatch clipId={c("a")} spacing={4} />
          <Hatch clipId={c("b")} spacing={4.5} />
        </>
      );

    // 08 Social & Content — paper plane with broadcast arcs
    default:
      return (
        <>
          <defs>
            <clipPath id={c("a")}>
              <path d="M14 58 L106 20 L70 96 L56 70 Z" />
            </clipPath>
          </defs>
          <path d="M14 58 L106 20 L70 96 L56 70 Z" />
          <path d="M106 20 L56 70" />
          <path d="M56 70 L44 88 L58 82" opacity={0.8} />
          <path d="M18 96 C24 84 34 76 46 72" opacity={0.5} />
          <path d="M12 104 C20 88 34 78 50 74" opacity={0.35} />
          <Hatch clipId={c("a")} spacing={5.5} />
        </>
      );
  }
}

export function StageSketch({ stage, className }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
      focusable="false"
    >
      <Sketch stage={stage} />
    </svg>
  );
}

export default StageSketch;
