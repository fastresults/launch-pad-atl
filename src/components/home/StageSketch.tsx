// Animated accent marks for each framework stage.
// Color comes from the theme: accents use var(--primary), structural strokes
// inherit currentColor from the section. Purely decorative.
// Animation keyframes/classes live in src/styles.css (prefixed `sm-`).

type Props = { stage: string; className?: string };

function Sketch({ stage }: { stage: string }) {
  switch (stage) {
    // 01 Foundation — slabs dropping into a stable stack
    case "01":
      return (
        <>
          <line className="sm-base" x1="32" y1="204" x2="208" y2="204" />
          <rect className="sm-slab" x="40" y="176" width="160" height="18" rx="3" />
          <rect className="sm-slab sm-d1" x="52" y="152" width="136" height="18" rx="3" />
          <rect className="sm-slab sm-d2" x="64" y="128" width="112" height="18" rx="3" />
          <rect className="sm-slab sm-d3" x="76" y="104" width="88" height="18" rx="3" />
          <rect className="sm-slab sm-cap sm-d4" x="108" y="76" width="24" height="18" rx="3" />
        </>
      );

    // 02 Strategy — routes converging on one target
    case "02":
      return (
        <>
          <path className="sm-guide" d="M20 58 C 80 58, 112 96, 158 116" />
          <path className="sm-guide" d="M20 120 C 80 120, 118 118, 158 120" />
          <path className="sm-guide" d="M20 192 C 80 192, 116 148, 158 126" />
          <path className="sm-run" d="M20 58 C 80 58, 112 96, 158 116" />
          <path className="sm-run sm-d1" d="M20 120 C 80 120, 118 118, 158 120" />
          <path className="sm-run sm-d2" d="M20 192 C 80 192, 116 148, 158 126" />
          <circle className="sm-guide" cx="176" cy="121" r="30" />
          <circle className="sm-ring" cx="176" cy="121" r="18" />
          <circle className="sm-core" cx="176" cy="121" r="7" />
        </>
      );

    // 03 Operations — counter-rotating rings around a turning square
    case "03":
      return (
        <>
          <circle className="sm-r1" cx="120" cy="120" r="88" />
          <circle className="sm-r2" cx="120" cy="120" r="62" />
          <circle className="sm-r3" cx="120" cy="120" r="38" />
          <rect className="sm-sq" x="106" y="106" width="28" height="28" rx="4" />
          <circle className="sm-tick" cx="120" cy="18" r="3.5" />
          <circle className="sm-tick sm-d1" cx="222" cy="120" r="3.5" />
          <circle className="sm-tick sm-d2" cx="120" cy="222" r="3.5" />
          <circle className="sm-tick sm-d3" cx="18" cy="120" r="3.5" />
        </>
      );

    // 04 Finance — columns growing, then a trend line
    case "04":
      return (
        <>
          <line className="sm-axis" x1="34" y1="198" x2="206" y2="198" />
          <rect className="sm-bar" x="42" y="154" width="22" height="44" rx="3" />
          <rect className="sm-bar sm-d1" x="78" y="130" width="22" height="68" rx="3" />
          <rect className="sm-bar sm-d2" x="114" y="142" width="22" height="56" rx="3" />
          <rect className="sm-bar sm-d3" x="150" y="102" width="22" height="96" rx="3" />
          <rect className="sm-bar sm-bar-hi sm-d4" x="186" y="74" width="22" height="124" rx="3" />
          <polyline className="sm-trend" points="53,146 89,122 125,134 161,94 197,66" />
        </>
      );

    // 05 Governance — an inner boundary sealing inside a fixed frame
    case "05":
      return (
        <>
          <polygon className="sm-guide" points="120,38 191,79 191,161 120,202 49,161 49,79" />
          <polygon className="sm-guide sm-faint" points="120,50 180,85 180,155 120,190 60,155 60,85" />
          <g className="sm-spokes">
            <line x1="120" y1="38" x2="120" y2="202" />
            <line x1="49" y1="79" x2="191" y2="161" />
            <line x1="191" y1="79" x2="49" y2="161" />
          </g>
          <polygon className="sm-seal" points="120,62 170,91 170,149 120,178 70,149 70,91" />
          <circle className="sm-lock" cx="120" cy="120" r="8" />
        </>
      );

    // 06 Brand — concentric arcs orbiting a steady centre
    case "06":
      return (
        <>
          <circle className="sm-guide sm-faint" cx="120" cy="120" r="78" />
          <circle className="sm-guide sm-faint" cx="120" cy="120" r="36" />
          <circle className="sm-a1" cx="120" cy="120" r="78" />
          <circle className="sm-a2" cx="120" cy="120" r="57" />
          <circle className="sm-a3" cx="120" cy="120" r="36" />
          <circle className="sm-beat" cx="120" cy="120" r="7" />
        </>
      );

    // 07 Marketing — a source broadcasting to receivers
    case "07":
      return (
        <>
          <circle className="sm-src" cx="58" cy="120" r="9" />
          <path className="sm-wave" d="M80 96 A34 34 0 0 1 80 144" />
          <path className="sm-wave sm-d1" d="M97 82 A60 60 0 0 1 97 158" />
          <path className="sm-wave sm-d2" d="M114 68 A86 86 0 0 1 114 172" />
          <circle className="sm-rx sm-rx1" cx="196" cy="82" r="6" />
          <circle className="sm-rx sm-rx2" cx="204" cy="120" r="6" />
          <circle className="sm-rx sm-rx3" cx="196" cy="158" r="6" />
        </>
      );

    // 08 Social & Content — a network pulsing outward from the hub
    default:
      return (
        <>
          <g className="sm-edges">
            <line x1="120" y1="120" x2="62" y2="62" />
            <line x1="120" y1="120" x2="120" y2="42" />
            <line x1="120" y1="120" x2="186" y2="72" />
            <line x1="120" y1="120" x2="196" y2="152" />
            <line x1="120" y1="120" x2="128" y2="196" />
            <line x1="120" y1="120" x2="48" y2="164" />
            <line x1="62" y1="62" x2="120" y2="42" opacity="0.6" />
            <line x1="186" y1="72" x2="196" y2="152" opacity="0.6" />
            <line x1="128" y1="196" x2="48" y2="164" opacity="0.6" />
          </g>
          <line className="sm-edge-run" x1="120" y1="120" x2="62" y2="62" />
          <line className="sm-edge-run sm-e2" x1="120" y1="120" x2="120" y2="42" />
          <line className="sm-edge-run sm-e3" x1="120" y1="120" x2="186" y2="72" />
          <line className="sm-edge-run sm-e4" x1="120" y1="120" x2="196" y2="152" />
          <line className="sm-edge-run sm-e5" x1="120" y1="120" x2="128" y2="196" />
          <line className="sm-edge-run sm-e6" x1="120" y1="120" x2="48" y2="164" />
          <circle className="sm-node" cx="62" cy="62" r="5.5" />
          <circle className="sm-node sm-e2" cx="120" cy="42" r="5.5" />
          <circle className="sm-node sm-e3" cx="186" cy="72" r="5.5" />
          <circle className="sm-node sm-e4" cx="196" cy="152" r="5.5" />
          <circle className="sm-node sm-e5" cx="128" cy="196" r="5.5" />
          <circle className="sm-node sm-e6" cx="48" cy="164" r="5.5" />
          <circle className="sm-hub" cx="120" cy="120" r="8" />
        </>
      );
  }
}

/** 01-overview — grid of points swept by expanding rings. Used as a section mark. */
export function OverviewSketch({ className }: { className?: string }) {
  const dots: [number, number][] = [];
  const skip = new Set(["120,84", "84,120", "120,120", "156,156"]);
  for (const y of [48, 84, 120, 156, 192]) {
    for (const x of [48, 84, 120, 156, 192]) {
      if (!skip.has(`${x},${y}`)) dots.push([x, y]);
    }
  }
  return (
    <svg
      viewBox="0 0 240 240"
      className={`stagemark ${className ?? ""}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="sm-dots">
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" />
        ))}
      </g>
      <circle className="sm-blip" cx="120" cy="84" r="3" />
      <circle className="sm-blip sm-d1" cx="84" cy="120" r="3" />
      <circle className="sm-blip sm-d2" cx="120" cy="120" r="3.5" />
      <circle className="sm-blip sm-d3" cx="156" cy="156" r="3" />
      <circle className="sm-sweep" cx="120" cy="120" r="96" />
      <circle className="sm-sweep sm-s2" cx="120" cy="120" r="96" />
      <circle className="sm-sweep sm-s3" cx="120" cy="120" r="96" />
    </svg>
  );
}

export function StageSketch({ stage, className }: Props) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={`stagemark ${className ?? ""}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <Sketch stage={stage} />
    </svg>
  );
}

export default StageSketch;
