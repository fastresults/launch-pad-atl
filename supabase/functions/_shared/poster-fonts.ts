// Poster fonts — fetches latin-subset woff2 files from Google Fonts once per
// cold start and returns base64 payloads so the generated SVG can embed real
// brand typography via @font-face. Embedded (data:) fonts render even when the
// SVG is displayed inside an <img>, where external resources are blocked.

type FontSpec = { family: string; weight: number; css: string };

const SPECS: Record<string, FontSpec> = {
  serif: {
    family: "PosterSerif",
    weight: 700,
    css: "https://fonts.googleapis.com/css2?family=Lora:wght@700&display=swap",
  },
  sans: {
    family: "PosterSans",
    weight: 500,
    css: "https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap",
  },
  sansBold: {
    family: "PosterSansBold",
    weight: 700,
    css: "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap",
  },
};

// Modern UA is required or Google serves legacy ttf.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const cache = new Map<string, string | null>();

function b64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}

async function loadOne(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key) ?? null;
  const spec = SPECS[key];
  let out: string | null = null;
  try {
    const cssRes = await fetch(spec.css, { headers: { "User-Agent": UA } });
    if (cssRes.ok) {
      const css = await cssRes.text();
      // Prefer the latin block (last @font-face in Google's output).
      const blocks = css.split("@font-face").filter((b) => b.includes("url("));
      const latin = blocks.find((b) => /unicode-range:[^;]*U\+0000/i.test(b)) ?? blocks[blocks.length - 1];
      const url = latin?.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
      if (url) {
        const fRes = await fetch(url);
        if (fRes.ok) out = b64(new Uint8Array(await fRes.arrayBuffer()));
      }
    }
  } catch (e) {
    console.warn("poster font load failed", key, e);
  }
  cache.set(key, out);
  return out;
}

export type PosterFonts = {
  serifFamily: string;
  sansFamily: string;
  sansBoldFamily: string;
  styleBlock: string;
};

const SERIF_STACK = `Georgia, 'Times New Roman', 'Iowan Old Style', serif`;
const SANS_STACK = `'Helvetica Neue', Helvetica, Arial, sans-serif`;

// Returns an SVG <style> block with embedded @font-face rules plus the family
// stacks to use. Falls back to system stacks if the fetch fails.
export async function loadPosterFonts(): Promise<PosterFonts> {
  const [serif, sans, sansBold] = await Promise.all([loadOne("serif"), loadOne("sans"), loadOne("sansBold")]);
  const faces: string[] = [];
  const face = (spec: FontSpec, data: string) =>
    `@font-face{font-family:'${spec.family}';font-style:normal;font-weight:${spec.weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`;
  if (serif) faces.push(face(SPECS.serif, serif));
  if (sans) faces.push(face(SPECS.sans, sans));
  if (sansBold) faces.push(face(SPECS.sansBold, sansBold));
  return {
    serifFamily: serif ? `'${SPECS.serif.family}', ${SERIF_STACK}` : SERIF_STACK,
    sansFamily: sans ? `'${SPECS.sans.family}', ${SANS_STACK}` : SANS_STACK,
    sansBoldFamily: sansBold ? `'${SPECS.sansBold.family}', ${SANS_STACK}` : SANS_STACK,
    styleBlock: faces.length ? `<style type="text/css"><![CDATA[${faces.join("")}]]></style>` : "",
  };
}
