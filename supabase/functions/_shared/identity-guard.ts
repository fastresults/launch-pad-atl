/**
 * Identity guard — makes sure a generated deliverable actually carries the
 * founder's company name and the committed logo instead of a name the model
 * invented or a `{Company}` placeholder it forgot to fill in.
 *
 * Used by venture-generate-document and venture-bulk-generate after the
 * gateway returns, before the document is persisted.
 */

export type IdentityCheck = {
  nameMissing: boolean;
  logoMissing: boolean;
  imageryMissing: boolean;
  ok: boolean;
};

/** Replace `{Company}` / `{COMPANY_NAME}` style placeholders with the real name. */
export function substituteIdentity(raw: string, companyName?: string | null): string {
  const name = (companyName ?? "").trim();
  if (!name || !raw) return raw;
  return raw.replace(
    /\{\s*(company|company[_ ]?name|brand|brand[_ ]?name|business[_ ]?name)\s*\}/gi,
    name,
  );
}

/** Does the body contain the company name (case/whitespace tolerant)? */
export function mentionsCompany(raw: string, companyName?: string | null): boolean {
  const name = (companyName ?? "").trim();
  if (!name) return true;
  const norm = (s: string) => s.toLowerCase().replace(/[\s\u2018\u2019'".,]+/g, " ").replace(/\s+/g, " ");
  return norm(raw).includes(norm(name));
}

export function checkIdentity(
  raw: string,
  opts: { companyName?: string | null; logoUrl?: string | null; requireImagery?: boolean },
): IdentityCheck {
  const nameMissing = !mentionsCompany(raw, opts.companyName);
  const logo = (opts.logoUrl ?? "").trim();
  const logoMissing = !!logo && !raw.includes(logo);
  const imageryMissing = !!opts.requireImagery &&
    !/<img\s/i.test(raw) &&
    !/imagery plan/i.test(raw);
  return { nameMissing, logoMissing, imageryMissing, ok: !nameMissing && !logoMissing && !imageryMissing };
}

/** Corrective instruction appended to a second gateway pass when a check fails. */
export function correctionPrompt(
  check: IdentityCheck,
  opts: { companyName?: string | null; logoUrl?: string | null },
): string {
  const fixes: string[] = [];
  if (check.nameMissing) {
    fixes.push(
      `You used the wrong company name. The company is **${opts.companyName}** — that exact string and no other. Rewrite the document so every headline, nav item, footer, meta title, email address and code sample uses it verbatim. Remove every trace of any other brand name you invented.`,
    );
  }
  if (check.logoMissing) {
    fixes.push(
      `The committed logo is missing. Render it as a literal \`<img src="${opts.logoUrl}" alt="${opts.companyName ?? "Company"} logo" />\` tag in the global header spec, in the brand-tokens table, and inside the paste-ready master prompt. Copy the URL character for character.`,
    );
  }
  if (check.imageryMissing) {
    fixes.push(
      "The document is text-only. Add the full Imagery Plan table (route, section, slot, visual type, aspect ratio, treatment, alt text, generation prompt) covering every section of every route, and restate it inside the master prompt's imagery spec. No page may have two consecutive text-only sections.",
    );
  }
  return [
    "Your previous draft failed brand validation. Reproduce the ENTIRE document from the top with the same structure, depth and word count, fixing exactly these problems:",
    ...fixes.map((f, i) => `${i + 1}. ${f}`),
    "Output the corrected document only — no apology, no commentary, no diff.",
  ].join("\n\n");
}
