// Collateral mock-ups.
//
// A flat PNG of a business card reads like a wireframe in a library grid. The
// same artwork sitting on a surface with a soft shadow reads like an agency
// deliverable. The print-ready flat file is still what gets downloaded; this is
// purely the presentation layer.

const KIND_SURFACE: Record<string, { tone: string; pad: number; tilt: number; stack: boolean }> = {
  business_card: { tone: "#E7E4DE", pad: 0.34, tilt: -3, stack: true },
  letterhead: { tone: "#ECEAE6", pad: 0.2, tilt: -1.5, stack: false },
  envelope: { tone: "#E7E4DE", pad: 0.26, tilt: 2, stack: false },
  notecard: { tone: "#EDEAE4", pad: 0.28, tilt: -2, stack: false },
  email_signature: { tone: "#F2F3F5", pad: 0.18, tilt: 0, stack: false },
  invoice: { tone: "#ECEAE6", pad: 0.2, tilt: 1.5, stack: false },
  proposal: { tone: "#ECEAE6", pad: 0.2, tilt: -1.5, stack: false },
  presentation: { tone: "#1B1D21", pad: 0.14, tilt: 0, stack: false },
  guidelines: { tone: "#EDEAE4", pad: 0.16, tilt: 0, stack: false },
};

function b64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * Wrap a rasterised page in a presentation scene. Returns an SVG string that
 * the caller rasterises with the same pipeline as everything else.
 */
export function mockupSvg(
  pngBytes: Uint8Array,
  pageW: number,
  pageH: number,
  kind: string,
): { svg: string; width: number; height: number } {
  const s = KIND_SURFACE[kind] ?? { tone: "#ECEAE6", pad: 0.22, tilt: 0, stack: false };
  const padX = Math.round(pageW * s.pad);
  const padY = Math.round(pageH * s.pad);
  const W = pageW + padX * 2;
  const H = pageH + padY * 2;
  const href = `data:image/png;base64,${b64(pngBytes)}`;
  const cx = W / 2, cy = H / 2;

  const ghost = s.stack
    ? `<g transform="translate(${Math.round(padX * 0.34)} ${Math.round(-padY * 0.26)}) rotate(${s.tilt * -2.2} ${cx} ${cy})" opacity="0.5">
        <rect x="${padX}" y="${padY}" width="${pageW}" height="${pageH}" fill="#ffffff" filter="url(#soft)"/>
      </g>`
    : "";

  return {
    width: W,
    height: H,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${s.tone}"/>
      <stop offset="1" stop-color="${s.tone}" stop-opacity="0.82"/>
    </linearGradient>
    <radialGradient id="pool" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0" stop-color="#000000" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${Math.max(6, Math.round(pageW * 0.014))}"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${cx}" cy="${cy + pageH * 0.42}" rx="${pageW * 0.62}" ry="${pageH * 0.16}" fill="url(#pool)"/>
  ${ghost}
  <g transform="rotate(${s.tilt} ${cx} ${cy})">
    <rect x="${padX + Math.round(pageW * 0.008)}" y="${padY + Math.round(pageH * 0.016)}" width="${pageW}" height="${pageH}" fill="#000000" opacity="0.28" filter="url(#soft)"/>
    <image x="${padX}" y="${padY}" width="${pageW}" height="${pageH}" xlink:href="${href}" href="${href}" preserveAspectRatio="none"/>
    <rect x="${padX}" y="${padY}" width="${pageW}" height="${pageH}" fill="none" stroke="#000000" stroke-opacity="0.08" stroke-width="1"/>
  </g>
</svg>`,
  };
}
