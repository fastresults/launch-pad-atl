// Mark slots: every place a logo actually lands on a generated piece.
//
// A piece is not one logo decision. A presentation cover wants the full lockup
// at hero scale, the running corner of an interior slide wants the symbol, and
// a dark closing slide wants the reversed artwork. Before this, one choice was
// made per piece and every page inherited it, which is how a card front and a
// card back ended up carrying the same oversized lockup.
//
// Each slot declares the geometry of the hole the mark drops into. The
// recommender scores the supplied form x tone cells against that geometry, so
// the default is the mark whose own proportions balance in that slot.

export type MarkForm = "symbol" | "horizontal" | "stacked" | "wordmark";
export type MarkTone = "colour" | "inverse";

export type MarkSlot = {
  /** Stable id, unique within a kind — persisted in the founder's choice. */
  id: string;
  label: string;
  /** What the admin is looking at, in plain terms. */
  hint: string;
  /** Hero marks carry the page; chrome marks are running furniture. */
  scale: "hero" | "chrome";
  /** Centred slots have a vertical axis; edge slots run along a margin. */
  align: "centred" | "edge";
  /** The ground the mark is painted on. */
  ground: "paper" | "brand" | "dark";
  /** Aspect of the box the template reserves — width / height. */
  boxAspect: number;
};

const SLOTS: Record<string, MarkSlot[]> = {
  business_card: [
    { id: "front", label: "Card front", hint: "Large mark centred in the colour field", scale: "hero", align: "centred", ground: "brand", boxAspect: 1.6 },
    { id: "back", label: "Card back", hint: "Small mark in the top corner", scale: "chrome", align: "edge", ground: "paper", boxAspect: 2.6 },
  ],
  letterhead: [
    { id: "header", label: "Letterhead header", hint: "Mark on the top margin, left aligned", scale: "chrome", align: "edge", ground: "paper", boxAspect: 3.0 },
  ],
  envelope: [
    { id: "header", label: "Envelope corner card", hint: "Small mark above the return address", scale: "chrome", align: "edge", ground: "paper", boxAspect: 3.0 },
  ],
  notecard: [
    { id: "primary", label: "Notecard face", hint: "Mark centred above the message", scale: "hero", align: "centred", ground: "paper", boxAspect: 1.8 },
  ],
  email_signature: [
    { id: "primary", label: "Signature mark", hint: "Mark left of the rule, vertically centred", scale: "chrome", align: "edge", ground: "paper", boxAspect: 2.4 },
  ],
  invoice: [
    { id: "header", label: "Invoice header", hint: "Mark on the top margin", scale: "chrome", align: "edge", ground: "paper", boxAspect: 2.8 },
  ],
  proposal: [
    { id: "header", label: "Proposal header", hint: "Mark on the top margin", scale: "chrome", align: "edge", ground: "paper", boxAspect: 2.8 },
  ],
  presentation: [
    { id: "cover", label: "Cover slide", hint: "Hero mark on the title slide", scale: "hero", align: "edge", ground: "brand", boxAspect: 2.2 },
    { id: "running", label: "Running corner", hint: "Small mark repeated on every interior slide", scale: "chrome", align: "edge", ground: "paper", boxAspect: 1.6 },
    { id: "closing", label: "Closing slide", hint: "Mark centred on the dark sign-off slide", scale: "hero", align: "centred", ground: "dark", boxAspect: 2.2 },
  ],
  guidelines: [
    { id: "cover", label: "Guidelines cover", hint: "Hero mark on the brand-colour cover", scale: "hero", align: "edge", ground: "brand", boxAspect: 2.2 },
    { id: "system", label: "Guidelines logo pages", hint: "The approved mark repeated across logo, clear-space and usage pages", scale: "hero", align: "centred", ground: "paper", boxAspect: 1.8 },
  ],
  // --- Studio surfaces -------------------------------------------------
  // Social Studio and Content Studio render one mark per asset, but the hole
  // it drops into differs sharply: an avatar is a square field carrying the
  // mark alone, a cover is a wide banner with the mark on the margin, a poster
  // is photography with the mark as chrome in a corner.
  studio_avatar: [
    { id: "primary", label: "Avatar mark", hint: "The mark alone, centred in the square brand field", scale: "hero", align: "centred", ground: "brand", boxAspect: 1.0 },
  ],
  studio_cover: [
    { id: "primary", label: "Cover mark", hint: "Mark on the banner margin, clear of the safe zone", scale: "chrome", align: "edge", ground: "dark", boxAspect: 3.0 },
  ],
  studio_post: [
    { id: "primary", label: "Post mark", hint: "Small mark in the poster corner", scale: "chrome", align: "edge", ground: "dark", boxAspect: 2.6 },
  ],
  studio_story: [
    { id: "primary", label: "Story mark", hint: "Small mark on the vertical frame", scale: "chrome", align: "edge", ground: "dark", boxAspect: 2.2 },
  ],
};

/**
 * Which studio slot set an asset kind renders into. Social and Content Studio
 * name their assets by platform surface; this maps those names onto the same
 * slot vocabulary collateral uses so one resolver serves every studio.
 */
export function studioMarkKind(assetKind: string): string {
  const k = String(assetKind || "").toLowerCase();
  if (/avatar|profile|logo_square/.test(k)) return "studio_avatar";
  if (/cover|banner|header/.test(k)) return "studio_cover";
  if (/story|reel|vertical|9x16|9:16/.test(k)) return "studio_story";
  return "studio_post";
}

/** Every slot this kind renders. Unknown kinds get one generic slot. */
export function slotsForKind(kind: string): MarkSlot[] {
  return SLOTS[kind] ?? [{
    id: "primary",
    label: "Mark",
    hint: "The mark used on this piece",
    scale: "hero",
    align: "edge",
    ground: "paper",
    boxAspect: 2.4,
  }];
}

export function slotById(kind: string, id: string): MarkSlot | null {
  return slotsForKind(kind).find((s) => s.id === id) ?? null;
}

/** True when this piece renders more than one distinct mark position. */
export function isMultiSlot(kind: string): boolean {
  return slotsForKind(kind).length > 1;
}

export type MarkCell = { form: MarkForm; tone: MarkTone; aspect?: number | null };

export type MarkRecommendation = {
  form: MarkForm;
  tone: MarkTone;
  reason: string;
  score: number;
};

/** Nominal proportions when the real artwork has not been measured. */
const NOMINAL_ASPECT: Record<MarkForm, number> = {
  symbol: 1,
  horizontal: 3.4,
  stacked: 1.05,
  wordmark: 4.2,
};

/** Marks with a vertical axis read symmetrical when centred. */
const AXIAL: MarkForm[] = ["symbol", "stacked"];

/**
 * Score every supplied cell against this slot and return the best, with the
 * reason that decided it. Deterministic on purpose: it runs inside the
 * generation worker and inside the admin UI, and must agree in both.
 */
export function recommendMark(slot: MarkSlot, inventory: MarkCell[]): MarkRecommendation | null {
  const supplied = inventory.filter((c) => c && c.form && c.tone);
  if (!supplied.length) return null;

  const wantsInverse = slot.ground !== "paper";
  const ranked = supplied.map((cell) => {
    const aspect = cell.aspect && cell.aspect > 0 ? cell.aspect : NOMINAL_ASPECT[cell.form];
    let score = 0;
    const notes: string[] = [];

    // Tone follows the ground it is painted on.
    if ((cell.tone === "inverse") === wantsInverse) {
      score += 2;
      notes.push(wantsInverse ? "reversed for the dark ground" : "colour on paper");
    } else {
      score -= 1.6;
    }

    // Scale: running furniture wants the symbol, hero positions want the name.
    if (slot.scale === "chrome") {
      if (cell.form === "symbol") { score += 2; notes.push("symbol holds up at chrome size"); }
      else if (cell.form === "horizontal") score += 1;
      else if (cell.form === "stacked") score += 0.2;
    } else {
      if (cell.form === "symbol") score -= 0.6;
      else { score += 1.5; notes.push("full lockup carries the page"); }
    }

    // Symmetry: a centred slot wants a mark with a vertical axis.
    if (slot.align === "centred") {
      if (AXIAL.includes(cell.form)) { score += 1.3; notes.push("vertical axis centres cleanly"); }
      else score -= 0.4;
    } else if (cell.form === "horizontal" || cell.form === "wordmark") {
      score += 0.9;
      notes.push("runs along the margin");
    }

    // Fit: how far the artwork's proportions sit from the reserved box. A
    // chrome slot is a small corner that flexes around the mark, so shape
    // matters less there than at hero scale, where the box is the composition.
    const fitWeight = slot.scale === "chrome" ? 0.6 : 1.2;
    score -= fitWeight * Math.abs(Math.log(aspect / slot.boxAspect));

    return { form: cell.form, tone: cell.tone, score, reason: notes[0] ?? "closest fit for this slot" };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  return { form: best.form, tone: best.tone, reason: best.reason, score: Number(best.score.toFixed(3)) };
}

/**
 * Resolve a founder's stored choice for a kind into a per-slot map.
 *
 * The stored shape used to be one cell per kind. That is read as "the same
 * cell in every slot" so existing choices survive without a migration.
 */
export function slotChoices(
  kind: string,
  stored: unknown,
): Record<string, { form: MarkForm; tone: MarkTone }> {
  const out: Record<string, { form: MarkForm; tone: MarkTone }> = {};
  const rec = stored && typeof stored === "object" ? stored as Record<string, unknown> : null;
  if (!rec) return out;
  const slots = rec.slots && typeof rec.slots === "object" ? rec.slots as Record<string, any> : null;
  if (slots) {
    for (const s of slotsForKind(kind)) {
      const v = slots[s.id];
      if (v?.form && v?.tone) out[s.id] = { form: v.form, tone: v.tone };
    }
    return out;
  }
  const legacy = (rec.requested ?? rec) as any;
  if (legacy?.form && legacy?.tone) {
    for (const s of slotsForKind(kind)) out[s.id] = { form: legacy.form, tone: legacy.tone };
    return out;
  }
  // A bare per-slot map (`{ front: cell, back: cell }`) — what the card sends
  // straight from its picker. Unknown keys are ignored so a stale slot id from
  // an older client can never smuggle a mark into a slot that no longer exists.
  for (const s of slotsForKind(kind)) {
    const v = rec[s.id] as any;
    if (v?.form && v?.tone) out[s.id] = { form: v.form, tone: v.tone };
  }
  return out;
}
