import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { stripSvgBackground } from "./logo-raster.ts";

const countShapes = (svg: string) => (svg.match(/<(path|polygon|rect)\b/gi) || []).length;

Deno.test("keeps every glyph of a traced wordmark (the missing E)", () => {
  // Real path data from The Friendship House mark: the final "E" of "House"
  // used to fake a full-canvas bbox and get stripped as a background plate.
  const E =
    'M2305.12,308.01v-102.49h77.45v19.03h-53.88v64.42h55.78v19.03h-79.36ZM2326.93,265.26v-18.59h49.34v18.59h-49.34Z';
  const T = 'M532.22,308.01v-83.16h-32.8v-19.33h89.31v19.33h-32.8v83.16h-23.72Z';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2384.47 408.85"><g>` +
    `<path class="cls-2" d="M0,151.77c17.03-15.51,37.07-26.54,55.93-39.62L100,0Z"/>` +
    `<path d="${T}"/><path d="${E}"/>` +
    `<path d="M900,100h50v50h-50Z"/><path d="M1000,100h50v50h-50Z"/>` +
    `</g></svg>`;
  const out = stripSvgBackground(svg);
  assertEquals(countShapes(out), countShapes(svg));
  assert(out.includes(E), "the final E must survive");
});

Deno.test("still removes an explicit white plate rect", () => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<rect x="0" y="0" width="100" height="100" fill="#ffffff"/>` +
    `<path fill="#0055a4" d="M10,10h30v30h-30Z"/></svg>`;
  const out = stripSvgBackground(svg);
  assert(!/<rect/i.test(out), "white plate rect removed");
  assert(out.includes("#0055a4"), "artwork kept");
});

Deno.test("still removes a white plate disguised as the first path", () => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<path fill="#fff" d="M0,0H100V100H0Z"/>` +
    `<path fill="#111" d="M10,10h30v30h-30Z"/></svg>`;
  const out = stripSvgBackground(svg);
  assert(!out.includes('fill="#fff"'), "white plate path removed");
  assert(out.includes('fill="#111"'), "artwork kept");
});
