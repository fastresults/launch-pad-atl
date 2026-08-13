// The Layout & Interaction Contract.
//
// The copy, image and surface contracts made PRDs verbose about words, imagery
// and colour roles — and left the page's *construction* unspecified. The sites
// that came back proved it: content flush to the viewport edge with no
// container, calls to action rendered as bare text, an active nav item drawn as
// a focus ring in a colour nobody can read, a cookie banner floating over live
// content with no surface of its own, two-column sections shipping an empty
// column, and a pricing page with no prices.
//
// None of those are content problems, and none of them were ever written down.
// This block writes them down, in terms a generated document can be measured
// against — see `craftVerdict` in website-prd.ts, which checks for exactly the
// markers this contract requires.

/** Section heading the PRD must carry so the checks can find the restatement. */
export const LAYOUT_CONTRACT_HEADING = "LAYOUT & INTERACTION CONTRACT (LOCKED)";

export function layoutContractBlock(): string {
  return `## ${LAYOUT_CONTRACT_HEADING}

Everything below is a hard requirement. A page that violates any rule here is rejected no matter how good its copy is.

**1. Shell and container.** Build one \`Container\` primitive — max-width 1280px, centred, with gutters that run 24px at 360px, 32px at 768px and 48px from 1280px up. Every band on every route renders its content inside it: announcement bar, header, hero, all page sections, footer, cookie banner, 404. A full-bleed background is allowed and encouraged; full-bleed *content* is not. The app shell sets \`overflow-x: hidden\` and no route may scroll horizontally at 360, 768, 1280 or 1920px. No text, logo, nav item or button may touch the viewport edge.

**2. Buttons.** Calls to action are components, never bare text.
- Primary: filled with the brand accent and its paired foreground, 12–16px vertical and 24–32px horizontal padding, the token radius, minimum 44px hit target, and specified \`hover\`, \`active\`, \`focus-visible\` and \`disabled\` states.
- Secondary: 1px border in the surface's border token, transparent fill, same geometry.
- Tertiary: text link with a persistent or hover underline and an arrow affordance.
Two adjacent CTAs declare their gap (minimum 12px) and their order — primary first. Every CTA in Section 4 names its variant. A CTA that renders as unstyled text is a hard failure.

**3. Navigation states.** Active route and keyboard focus are two different treatments and must never be the same thing. Specify the active indicator (weight change plus a 2px accent underline or a filled pill) with its measured contrast against the header surface — minimum 4.5:1 for the label. Specify \`focus-visible\` separately as an offset ring in the accent. A focus ring is never the active-route marker, and an active label may never drop below the contrast floor.

**4. Overlays and elevation.** Announcement bar, cookie banner, mobile nav, dropdowns and modals each declare: their surface token, their elevation/shadow, and a z-index from a named ladder (base 0, sticky header 50, dropdown 100, overlay 200, modal 300, toast 400). Any overlay that sits above page content carries its own opaque or backdrop-blurred surface and its own foreground pair — never transparent type over live content. The cookie banner is a card with real buttons, is dismissible, and never covers a headline, image caption or primary CTA. The announcement bar's dismiss control sits inside the container, not against the viewport edge.

**5. Composition.** No two-column section may ship an empty column: column two carries an image, a stat block, a quote, a form or a card set — otherwise the section is single-column with a stated measure (62–70 characters) and centred or offset deliberately. Section spacing comes from a named rhythm scale (e.g. 64 / 96 / 128px major, 32 / 48px minor), not ad-hoc padding, and a section boundary is marked by surface change or rhythm, not by a hairline rule alone. No route may open with a lede and a body paragraph that restate the same point — the lede sets the stakes, the body advances the argument.

**6. Type on imagery.** Any type set over an image — hero, card, band, overlay — declares the scrim (direction, colours, opacity stops, applied in CSS and never baked into the render) and the clean side of the frame the type occupies. A headline may not cross a face or the image's focal subject. Card titles over photography sit on a scrim or in a solid caption plate.

**7. Brand colour deployment, per route.** Every route names where the accent appears: the primary CTA, the active nav state, at least one full-bleed brand or inverted band, and one editorial accent (rule, eyebrow, numeral or underline). A route rendered entirely in neutrals with the accent only in the logo is a failure. Eyebrow / kicker labels are tracked micro-caps (11–13px, 0.12–0.16em tracking) in the accent or muted-foreground — never body text at body size.

**8. Pricing and offer pages.** Tiers render as cards: name, price or an explicit pricing basis, a one-line who-it-is-for, an inclusion list written as full sentences, and a CTA button per tier with its own label. One tier is visually emphasised. A pricing route that shows no price and no explicit basis is a hard failure.

**9. Header and footer logo presence.** The logo is the brand's largest identity moment on the page and must never render as a small icon. Header lockup height: 44–56px desktop, 56–72px when the header sits transparent over a hero, 36–44px mobile; the scrolled state may shrink it by at most 20% and never below 36px desktop. Footer lockup: a deliberate brand moment at 72–120px tall (or a wordmark up to 320px wide) on its own row above the link columns — never inline with the legal line and never the header size reused. Both declare clear space of at least half the mark's height on every side, both sit inside the container, and both use the \`/auto?on=<background hex>\` endpoint on any non-light surface. The header also declares its surface, its scrolled state and its mobile behaviour at the stated breakpoint.

**10. Parallax depth on heroes and full-bleed bands.** Every hero with a background image runs a three-plane parallax depth stack: background plate at 0.25x scroll, midground subject at 0.6x, foreground type at 1.0x. Every full-bleed image band on an interior route runs at minimum a two-plane version. The darkening between plate and type is a CSS gradient scrim, never baked into the render. Animate transform only, reserve \`aspect-ratio\` on every plate, apply \`will-change: transform\` to the plate alone, and collapse the whole stack to a static, finished composition under \`prefers-reduced-motion\`. Each route's Section 4 spec names its parallax treatment; the master prompt repeats the technique verbatim. A hero that scrolls as one flat image is a failure.

**11. Typographic contract.** Type is art-directed, not defaulted.
- *Pairing*: name which family is display and which is text, and state why the pairing works (serif display against humanist sans text, or grotesk display against serif text). One family doing every job at every size is a failure.
- *Scale*: a named modular scale (1.250 or 1.333) with a display \`clamp()\` range, and stated tracking per tier — display -0.02 to -0.03em, body 0, eyebrow +0.12–0.16em micro-caps.
- *Weight and tone*: at most three weights across the whole site; hierarchy comes from size, case and space, not from bolding everything. Body copy 17–19px at 1.6–1.75 leading on a 62–70 character measure.
- *Opacity ladder*: hierarchy uses a token ladder — primary text 100%, secondary 72%, tertiary/meta 56%, disabled 38%. No arbitrary opacity values. Text set over imagery never drops below 90%; contrast there comes from the scrim, not from fading the type.
- *Editorial devices*: at least two per site from drop cap, oversized pull quote, statistic set as display type, running section numerals, hanging punctuation.
- *Hygiene*: tabular numerals in tables and metrics, \`font-display: swap\`, the display face preloaded, no faux bold or faux italic, optical sizing where the face supports it.

**12. Image production tier.** Every generated image is produced on the Pro-tier image model (\`google/gemini-3-pro-image\`) at the highest resolution the model offers — one image per call, never batched into a contact sheet. Hero and full-bleed plates render wide enough to fill 1920px at 2x density without upscaling; card and portrait art renders at 2x its display box. The imagery table states the model, the source pixel dimensions and the aspect ratio for every slot. Low-tier or upscaled placeholder imagery is a hard failure.

Restate this contract as its own subsection in Section 3, apply it in every route's Section 4 spec, and repeat the rules that touch generated code verbatim inside the Section 8 master prompt.`;
}

/**
 * The imagery half of the contract, on its own so the targeted Section 4b
 * repair can be handed exactly the rules it failed without re-sending the
 * whole layout contract.
 */
export function imageryContractBlock(): string {
  return `## IMAGERY CONTRACT (LOCKED)

Section 4b is one Markdown table with these columns, in this order:

Route | Section | Slot name | Visual type | Aspect ratio | Treatment | Exposure & contrast target | Text-overlay plan | Parallax plan | Caption / on-page copy | Narrative role | Alt text | Generation prompt

- **Density**: the home route (\`/\`) carries at least 8 rows; every interior route carries at least 4. Every section named in Section 4 has at least one row. Cover the slots founders always miss: proof/logo bar, every process step, every feature card, the results/stats visual, one portrait per testimonial, and a closing full-bleed CTA band.
- **Exposure**: every row states a numeric target (e.g. "subject at 35–55% luminance, open shadows"). Adjectives like "moody", "dark" or "near-black" are only allowed alongside that number.
- **Hero and full-bleed rows** state that darkening is a CSS gradient scrim applied over a clean, properly exposed image and never baked into the render, and name the clean side of the frame.
- **Parallax plan**: hero and full-bleed rows declare the three-plane stack (plate 0.25x / midground 0.6x / type 1.0x) with the \`prefers-reduced-motion\` fallback; interior bands may declare the two-plane version; everything else says "static".
- **Caption / on-page copy**: the real words printed beside the image, in the venture's voice. Only texture / gradient bands may say "none".
- **Narrative role**: the one sentence of Section 4 body copy this image illustrates, quoted so it can be matched.
- **Production**: Pro-tier image model (\`google/gemini-3-pro-image\`), one image per call, hero plates wide enough for 1920px at 2x density; state the model, source pixel dimensions and aspect ratio per row.
- Portraits use the portrait recipe (85mm equivalent, ~f/2, soft 45-degree key with fill and rim, catchlights, real skin texture). No generated image contains text, numbers, hex codes, logos or watermarks.`;
}

/** The human-checkable list the PRD must close with. */
export function buildAcceptanceChecklist(): string {
  return `## BUILD ACCEPTANCE CHECKLIST

Verify each item on the built site before it is considered done. Any unchecked line is a defect, not a preference.

- [ ] No horizontal scrolling at 360px, 768px, 1280px and 1920px.
- [ ] No text, logo, nav item or button touches the viewport edge on any route.
- [ ] Every call to action renders as a real button with hover, focus-visible and active states.
- [ ] The active nav item is legible (4.5:1 or better) and visually distinct from the focus ring.
- [ ] No overlay — cookie banner, announcement bar, mobile nav — sits over content without its own surface, and none covers a headline or CTA.
- [ ] No section ships an empty second column, and no page opens with a lede and body that say the same thing.
- [ ] The brand accent appears on every route in at least the primary CTA and one band or editorial accent.
- [ ] All type over imagery sits on a CSS scrim and clears the image's focal subject.
- [ ] The pricing route shows a price or an explicit pricing basis and a CTA for every tier.
- [ ] The header logo renders at 44–56px desktop and the footer logo at 72–120px on its own row — neither is a small inline icon.
- [ ] Every hero with a background image runs the three-plane parallax stack, and it collapses to a static composition under prefers-reduced-motion.
- [ ] Display and text faces are a stated pairing on a named modular scale, with hierarchy driven by the 100 / 72 / 56 / 38% opacity ladder rather than arbitrary values.
- [ ] Every image was generated on the Pro-tier image model at full resolution — no upscaled or placeholder art.
- [ ] The home route ships at least 8 images and every interior route at least 4, and no section is text-only.
- [ ] Every hero and full-bleed plate is properly exposed (subject 35–55% luminance) with its darkening applied as a CSS scrim, not baked into the render.
- [ ] Every image carries a printed caption or credit and sits beside the body sentence it illustrates.
- [ ] Every route has a unique title, meta description, canonical, one H1, an above-the-fold CTA and accessible alt text.`;
}
