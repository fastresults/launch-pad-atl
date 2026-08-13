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

**9. Header and logo.** The logo lockup declares its display height (28–40px desktop) and its clear space (minimum half the mark's height on every side), and sits inside the container. The header declares its surface, its scrolled state, and its mobile behaviour at the stated breakpoint.

Restate this contract as its own subsection in Section 3, apply it in every route's Section 4 spec, and repeat the rules that touch generated code verbatim inside the Section 8 master prompt.`;
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
- [ ] Every route has a unique title, meta description, canonical, one H1, an above-the-fold CTA and accessible alt text.`;
}
