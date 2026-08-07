// GLOBAL RULE: the venture brief decides the formation state.
//
// Precedence for any "which state are we forming in?" decision:
//   1. An explicit choice the founder made on the Legal Setup page
//      (legal_setup_progress.entity_state with entity_state_source = 'user')
//   2. The venture brief / snapshot location (region, then city text)
//   3. The filing record's state
//   4. "GA" as the last-resort fallback
//
// Anything that needs a state code (UI copy, walkthroughs, generated
// documents, edge functions) must resolve it through resolveEntityState so
// a Georgia venture never shows an Oregon workflow.

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  "washington dc": "DC", "washington d.c.": "DC", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};

const VALID_CODES = new Set(Object.values(STATE_NAME_TO_CODE));

/** Map free text ("Georgia", "GA", "Stone Mountain, GA") to a 2-letter code. */
export function stateCodeFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const raw = String(text).trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (upper.length === 2 && VALID_CODES.has(upper)) return upper;

  const lower = raw.toLowerCase().replace(/\s+/g, " ");
  if (STATE_NAME_TO_CODE[lower]) return STATE_NAME_TO_CODE[lower];

  // "Stone Mountain, Georgia" / "Atlanta, GA 30301"
  const parts = lower.split(/[,/|]/).map((p) => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (STATE_NAME_TO_CODE[p]) return STATE_NAME_TO_CODE[p];
    const token = p.split(/\s+/)[0].toUpperCase();
    if (token.length === 2 && VALID_CODES.has(token)) return token;
  }

  // Whole-word name match anywhere in the string.
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return code;
  }
  return null;
}

export type EntityStateInputs = {
  /** legal_setup_progress.entity_state */
  savedState?: string | null;
  /** legal_setup_progress.entity_state_source — 'user' means the founder picked it */
  savedSource?: string | null;
  /** venture snapshot / brief */
  briefRegion?: string | null;
  briefCity?: string | null;
  /** filing record */
  filingState?: string | null;
};

export type EntityStateResolution = {
  code: string;
  /** where the code came from */
  source: "user" | "brief" | "filing" | "fallback";
};

export function resolveEntityState(input: EntityStateInputs): EntityStateResolution {
  const saved = stateCodeFromText(input.savedState);
  if (saved && input.savedSource === "user") return { code: saved, source: "user" };

  const brief = stateCodeFromText(input.briefRegion) ?? stateCodeFromText(input.briefCity);
  if (brief) return { code: brief, source: "brief" };

  const filing = stateCodeFromText(input.filingState);
  if (filing) return { code: filing, source: "filing" };

  if (saved) return { code: saved, source: "user" };
  return { code: "GA", source: "fallback" };
}
