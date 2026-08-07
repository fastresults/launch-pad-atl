// Text inventory for the brand collateral set.
//
// Every printed or sent piece is only as good as the words on it. This module
// is the single description of which text a piece needs, how to normalise it,
// and how to tell the founder when something is missing or looks wrong.
//
// NOTE: mirrored client-side at src/lib/brand/collateral-fields.ts
// (edge functions cannot import from src/). Keep both in sync.

export type FieldKey =
  | "company"
  | "tagline"
  | "person_name"
  | "person_title"
  | "email"
  | "phone"
  | "website"
  | "address_street"
  | "address_city"
  | "address_state"
  | "address_zip"
  | "social"
  | "legal_entity"
  | "tax_id"
  | "payment_terms"
  | "voice";

export type ContactDetails = Partial<Record<FieldKey, string>>;

export type FieldFlag = { level: "ok" | "missing" | "suspect"; message?: string };

export type FieldSpec = {
  key: FieldKey;
  label: string;
  help: string;
  required: boolean;
  group: "identity" | "person" | "reach" | "address" | "business";
  multiline?: boolean;
  placeholder?: string;
  /** Collateral kinds that print this field. */
  usedBy: string[];
};

export const KIND_LABEL: Record<string, string> = {
  business_card: "Business card",
  letterhead: "Letterhead",
  envelope: "#10 envelope",
  notecard: "Notecard",
  email_signature: "Email signature",
  invoice: "Invoice",
  proposal: "Proposal",
  presentation: "Presentation",
  guidelines: "Guidelines",
  design_tokens: "Design tokens",
};

export const FIELD_SPECS: FieldSpec[] = [
  {
    key: "company",
    label: "Company name",
    help: "Exactly as it should be set in type — this is what a printer reproduces.",
    required: true,
    group: "identity",
    placeholder: "Acme Home Care",
    usedBy: ["business_card", "letterhead", "envelope", "notecard", "email_signature", "invoice", "proposal", "presentation", "guidelines"],
  },
  {
    key: "tagline",
    label: "Tagline",
    help: "One short line. Keep it under 60 characters so it sets on a single line.",
    required: false,
    group: "identity",
    placeholder: "Care that stays close to home",
    usedBy: ["business_card", "letterhead", "notecard", "presentation", "guidelines"],
  },
  {
    key: "person_name",
    label: "Your name",
    help: "The name on the card and in the email signature.",
    required: true,
    group: "person",
    placeholder: "Jordan Reyes",
    usedBy: ["business_card", "email_signature", "letterhead", "proposal"],
  },
  {
    key: "person_title",
    label: "Job title",
    help: "Short and specific. 'Founder' beats 'Chief Visionary Officer'.",
    required: true,
    group: "person",
    placeholder: "Founder",
    usedBy: ["business_card", "email_signature"],
  },
  {
    key: "email",
    label: "Email",
    help: "A business-domain address reads far better on a card than a personal inbox.",
    required: true,
    group: "reach",
    placeholder: "jordan@acmehomecare.com",
    usedBy: ["business_card", "letterhead", "envelope", "email_signature", "invoice", "proposal"],
  },
  {
    key: "phone",
    label: "Phone",
    help: "Printed in a consistent display format across every piece.",
    required: true,
    group: "reach",
    placeholder: "(404) 555-0182",
    usedBy: ["business_card", "letterhead", "email_signature", "invoice"],
  },
  {
    key: "website",
    label: "Website",
    help: "Shown without the https:// — just the domain.",
    required: true,
    group: "reach",
    placeholder: "acmehomecare.com",
    usedBy: ["business_card", "letterhead", "envelope", "notecard", "email_signature", "invoice", "proposal", "presentation"],
  },
  {
    key: "social",
    label: "Social handle",
    help: "Optional. One handle only — a card with five icons looks like a flyer.",
    required: false,
    group: "reach",
    placeholder: "@acmehomecare",
    usedBy: ["business_card", "email_signature"],
  },
  {
    key: "address_street",
    label: "Street address",
    help: "Optional. Leave blank if you don't want a physical address in print.",
    required: false,
    group: "address",
    placeholder: "1200 Peachtree St NE, Suite 400",
    usedBy: ["business_card", "letterhead", "envelope", "invoice"],
  },
  { key: "address_city", label: "City", help: "", required: false, group: "address", placeholder: "Atlanta", usedBy: ["business_card", "letterhead", "envelope", "invoice"] },
  { key: "address_state", label: "State", help: "Two-letter postal abbreviation.", required: false, group: "address", placeholder: "GA", usedBy: ["business_card", "letterhead", "envelope", "invoice"] },
  { key: "address_zip", label: "ZIP", help: "", required: false, group: "address", placeholder: "30309", usedBy: ["business_card", "letterhead", "envelope", "invoice"] },
  {
    key: "legal_entity",
    label: "Legal entity line",
    help: "Optional. e.g. 'Acme Home Care LLC' — printed small on invoices and proposals.",
    required: false,
    group: "business",
    placeholder: "Acme Home Care LLC",
    usedBy: ["invoice", "proposal"],
  },
  {
    key: "tax_id",
    label: "EIN / tax ID",
    help: "Optional. Some clients require it on an invoice before they can pay.",
    required: false,
    group: "business",
    placeholder: "88-1234567",
    usedBy: ["invoice"],
  },
  {
    key: "payment_terms",
    label: "Payment terms",
    help: "One line, printed on the invoice footer.",
    required: false,
    group: "business",
    placeholder: "Net 15. Make checks payable to Acme Home Care LLC.",
    usedBy: ["invoice"],
  },
  {
    key: "voice",
    label: "Voice in one sentence",
    help: "How the brand sounds — used on the guidelines voice page.",
    required: false,
    group: "business",
    multiline: true,
    placeholder: "Plain, warm and specific. Short sentences. Name the outcome, not the process.",
    usedBy: ["guidelines"],
  },
];

export const FIELD_BY_KEY: Record<string, FieldSpec> = Object.fromEntries(
  FIELD_SPECS.map((f) => [f.key, f]),
) as Record<string, FieldSpec>;

/** Required fields for a given collateral kind. */
export function requiredFieldsFor(kind: string): FieldSpec[] {
  return FIELD_SPECS.filter((f) => f.required && f.usedBy.includes(kind));
}

// ── normalisation ───────────────────────────────────────────────────────────

const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|aol|icloud|proton(mail)?|live|msn)\./i;
const PLACEHOLDER = /(example\.com|yourdomain|your-?site|lorem|test\.com|acme\.com|tbd|n\/a|coming ?soon|placeholder)/i;

function tidy(v: unknown): string {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
  return s.replace(/\S+/g, (w) =>
    /^[A-Z0-9&.\-']+$/.test(w) && w.length <= 4 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

export function formatPhone(raw: string): string {
  const digits = tidy(raw).replace(/[^\d+]/g, "");
  const us = digits.replace(/^\+?1/, "").replace(/\D/g, "");
  if (us.length === 10) return `(${us.slice(0, 3)}) ${us.slice(3, 6)}-${us.slice(6)}`;
  return tidy(raw);
}

export function displayDomain(raw: string): string {
  return tidy(raw)
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

/** Clean one field for print. Applied on save so every piece agrees. */
export function normalizeField(key: FieldKey, value: string): string {
  const v = tidy(value);
  if (!v) return "";
  switch (key) {
    case "company":
      // Fix shouty or all-lowercase entry, leave deliberate casing alone.
      return v === v.toUpperCase() || v === v.toLowerCase() ? titleCase(v) : v;
    case "person_name":
      return v === v.toUpperCase() || v === v.toLowerCase() ? titleCase(v) : v;
    case "person_title":
      return titleCase(v);
    case "email":
      return v.toLowerCase();
    case "phone":
      return formatPhone(v);
    case "website":
      return displayDomain(v).toLowerCase();
    case "address_state":
      return v.slice(0, 2).toUpperCase();
    case "address_city":
      return titleCase(v);
    case "address_street":
      return v.replace(/\bSuite\b/i, "Suite").replace(/\bste\.?\b/i, "Suite");
    case "social":
      return v.startsWith("@") ? v : `@${v.replace(/^https?:\/\/\S+\//, "")}`;
    case "tagline":
      return v.replace(/[.]$/, "");
    default:
      return v;
  }
}

export function normalizeDetails(d: ContactDetails): ContactDetails {
  const out: ContactDetails = {};
  for (const spec of FIELD_SPECS) {
    const v = normalizeField(spec.key, d[spec.key] ?? "");
    if (v) out[spec.key] = v;
  }
  return out;
}

// ── audit ───────────────────────────────────────────────────────────────────

/** Grade one field: present / missing / looks wrong. */
export function auditField(key: FieldKey, raw: string | undefined): FieldFlag {
  const spec = FIELD_BY_KEY[key];
  const v = tidy(raw);
  if (!v) {
    return spec?.required
      ? { level: "missing", message: "Required — pieces that print it can't be generated." }
      : { level: "ok" };
  }
  if (PLACEHOLDER.test(v)) return { level: "suspect", message: "Looks like placeholder text." };

  switch (key) {
    case "company":
      if (v.length > 42) return { level: "suspect", message: "Very long — it will set small on a card." };
      break;
    case "tagline":
      if (v.length > 60) return { level: "suspect", message: `${v.length} characters — trim to 60 or it wraps.` };
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return { level: "suspect", message: "Doesn't look like a valid address." };
      if (FREE_MAIL.test(v)) return { level: "suspect", message: "Personal inbox — a domain address reads more credible in print." };
      break;
    case "phone":
      if (v.replace(/\D/g, "").length < 10) return { level: "suspect", message: "Fewer than 10 digits." };
      break;
    case "website":
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(displayDomain(v))) return { level: "suspect", message: "Doesn't look like a domain." };
      break;
    case "address_state":
      if (!/^[A-Z]{2}$/.test(v)) return { level: "suspect", message: "Use the two-letter postal code." };
      break;
    case "address_zip":
      if (!/^\d{5}(-\d{4})?$/.test(v)) return { level: "suspect", message: "Expected a 5-digit ZIP." };
      break;
    case "person_title":
      if (v.length > 34) return { level: "suspect", message: "Too long for a card line." };
      break;
    default:
      break;
  }
  return { level: "ok" };
}

export type AuditResult = {
  flags: Record<string, FieldFlag>;
  missingRequired: FieldKey[];
  suspect: FieldKey[];
  /** kind -> the required fields it is still missing. */
  blockedKinds: Record<string, FieldKey[]>;
  ready: boolean;
};

export function auditDetails(d: ContactDetails, kinds?: string[]): AuditResult {
  const flags: Record<string, FieldFlag> = {};
  const missingRequired: FieldKey[] = [];
  const suspect: FieldKey[] = [];

  for (const spec of FIELD_SPECS) {
    const flag = auditField(spec.key, d[spec.key]);
    flags[spec.key] = flag;
    if (flag.level === "missing") missingRequired.push(spec.key);
    if (flag.level === "suspect") suspect.push(spec.key);
  }

  const target = kinds?.length ? kinds : Object.keys(KIND_LABEL);
  const blockedKinds: Record<string, FieldKey[]> = {};
  for (const kind of target) {
    const gaps = requiredFieldsFor(kind)
      .map((f) => f.key)
      .filter((k) => missingRequired.includes(k));
    if (gaps.length) blockedKinds[kind] = gaps;
  }

  return { flags, missingRequired, suspect, blockedKinds, ready: missingRequired.length === 0 };
}

/** One-line address for a footer, and the block form for an envelope. */
export function addressLine(d: ContactDetails): string {
  const cityState = [d.address_city, d.address_state].filter(Boolean).join(", ");
  return [d.address_street, [cityState, d.address_zip].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
}

export function addressBlock(d: ContactDetails): string[] {
  const cityState = [d.address_city, d.address_state].filter(Boolean).join(", ");
  return [d.address_street ?? "", [cityState, d.address_zip].filter(Boolean).join(" ")].filter(Boolean);
}

/** Fields the founder has left blank that are optional — layouts adapt. */
export function skippedOptional(d: ContactDetails): FieldKey[] {
  return FIELD_SPECS.filter((f) => !f.required && !tidy(d[f.key])).map((f) => f.key);
}
