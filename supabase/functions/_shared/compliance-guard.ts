/**
 * Compliance guard.
 *
 * A venture can carry operator-verified `compliance_rules` on its brain (see
 * venture-context.ts / snapshot-brain.ts). The COMPLIANCE LOCK puts those rules
 * in front of the model, but a prompt is a request, not a guarantee — and a
 * regulated venture cannot ship an asset that contradicts them.
 *
 * This is the check after the fact: it reads generated markdown, including the
 * text inside fenced code blocks and paste-ready templates (where the first
 * Utah scrub missed a "$500 referral incentive" email), and reports violations
 * so the caller can run a repair pass before the asset lands in the share link.
 *
 * Rules are derived from the venture's own compliance_rules + banned_assumptions,
 * so nothing here is Utah-specific: a rule that names a forbidden rule number,
 * bans referral compensation, or requires a qualifier is enforced generically.
 */

export type ComplianceViolation = {
  code: string;
  /** What tripped, in words a founder understands. */
  message: string;
  /** The offending excerpt, trimmed for prompts and logs. */
  excerpt: string;
};

export type ComplianceVerdict = {
  ok: boolean;
  violations: ComplianceViolation[];
  /** True when the venture carries no compliance rules — nothing to enforce. */
  inactive: boolean;
};

export type ComplianceInput = {
  compliance_rules?: string[] | null;
  banned_assumptions?: string[] | null;
};

const EXCERPT = 220;

function excerptAround(text: string, index: number, len: number) {
  const start = Math.max(0, index - 90);
  return text.slice(start, Math.min(text.length, index + len + 130)).replace(/\s+/g, " ").trim().slice(0, EXCERPT);
}

/** Rule numbers a venture has explicitly banned, e.g. "never cite R590-190". */
export function bannedCitations(input: ComplianceInput): string[] {
  const src = [...(input.compliance_rules ?? []), ...(input.banned_assumptions ?? [])].join("\n");
  const out = new Set<string>();
  // Only pick up rule numbers that appear in a prohibition sentence.
  for (const sentence of src.split(/(?<=[.!?])\s+|\n+/)) {
    if (!/\b(never|do not|don't|not\b.*\bcite|bars?|prohibit|forbid|invalid|wrong)\b/i.test(sentence)) continue;
    for (const m of sentence.matchAll(/\b(R\d{3}-\d{2,4}(?:-\d+)?(?:\(\d+\)(?:\([a-z]\))?)?|§?\s?\d{1,3}[A-Z]?-\d{1,2}-\d{2,4})\b/g)) {
      const token = m[1].replace(/^§\s?/, "").trim();
      // A rule the venture is told to USE also shows up in these sentences
      // ("The governing rule is X. Never cite Y."). Keep only the banned side.
      const after = sentence.slice(sentence.indexOf(token));
      const before = sentence.slice(0, sentence.indexOf(token));
      if (/\b(never|do not|don't|not)\b[^.]*$/i.test(before) || /\bis not\b/i.test(after.slice(0, 30))) {
        out.add(token);
      }
    }
  }
  return [...out];
}

function has(rules: string, ...needles: string[]) {
  return needles.some((n) => rules.includes(n));
}

/**
 * Check generated markdown against the venture's compliance rules.
 * `content` is checked whole — fenced blocks included — on purpose.
 */
export function checkCompliance(content: string, input: ComplianceInput): ComplianceVerdict {
  const rules = [...(input.compliance_rules ?? []), ...(input.banned_assumptions ?? [])]
    .filter((r) => typeof r === "string" && r.trim());
  if (!rules.length) return { ok: true, violations: [], inactive: true };

  const lower = rules.join("\n").toLowerCase();
  const violations: ComplianceViolation[] = [];
  const push = (code: string, message: string, m: RegExpMatchArray) => {
    if (violations.some((v) => v.code === code)) return; // one hit per rule keeps repair prompts short
    violations.push({ code, message, excerpt: excerptAround(content, m.index ?? 0, m[0].length) });
  };

  // 1. Rule numbers the venture has banned.
  for (const cite of bannedCitations(input)) {
    const m = content.match(new RegExp(cite.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    if (m) push(`banned_citation:${cite}`, `Cites ${cite}, which this venture's compliance rules forbid.`, m);
  }

  /**
   * Copy that disclaims a practice ("we never endorse a check", "no gift card
   * is paid") is the compliant form of the same sentence. Only flag a match
   * when it is being offered, not refused.
   */
  const offered = (m: RegExpMatchArray) => {
    const before = content.slice(Math.max(0, (m.index ?? 0) - 80), m.index ?? 0);
    return !/\b(no|not|never|without|nor|bars?|barred|prohibits?|prohibited|forbid(s|den)?|may not|cannot|can't|don'?t|do not|refuse[sd]?)\b[^.!?]*$/i.test(before);
  };

  // 2. Paying for referrals when the rules bar referral compensation.
  if (has(lower, "referral", "refer")) {
    const barsPaidReferral =
      /\b(may not|cannot|must not|never|do not|don'?t|bars?|prohibit|no)\b[^.]{0,140}\b(compensat|paid referral|referral fee|referral incentive|commission|gift card|kickback)/i.test(lower)
      || /\bno (cash|payment|compensation|commission|gift)/i.test(lower);
    if (barsPaidReferral) {
      const m = content.match(/(\$\s?\d[\d,]*\s*(?:referral|bonus|reward|incentive|thank[- ]you)|referral (?:fee|incentive|bonus|reward|commission|payout)|finder'?s fee|gift card|affiliate commission|kickback)/i);
      if (m && offered(m)) {
        push("paid_referral", "Offers payment, a gift card or a commission for a referral, which the compliance rules bar.", m);
      }
    }
  }

  // 3. Handling the client's settlement money when the rules forbid it.
  if (/\b(payee|endorse|settlement (draft|check))\b/i.test(lower)) {
    const m = content.match(/\b(we (?:will )?endorse|endorse (?:the|a|any) (?:carrier |settlement )?(?:check|draft)|two[- ]party check|payable to (?:us|the adjuster|our firm)|deposited? into our (?:trust |operating )?account)\b/i);
    if (m && offered(m)) {
      push("check_handling", "Describes the firm handling or endorsing the client's settlement payment, which the compliance rules forbid.", m);
    }
  }

  // 4. A fee promise stated without a qualifier the rules require.
  const requiresQualifier = /72[- ]hour|policy limits/i.test(lower);
  if (requiresQualifier) {
    const feeClaim = content.match(/(\d{1,2}(?:\.\d+)?\s?%\s?(?:contingency|fee|of (?:the )?(?:new money|additional )?(?:recovery|settlement))|contingency fee of \d|no fee unless|you owe us nothing|nothing unless we|only pay (?:if|when) we (?:win|recover))/i);
    if (feeClaim) {
      const window = content.slice(Math.max(0, (feeClaim.index ?? 0) - 1200), (feeClaim.index ?? 0) + 1600);
      if (!/72[- ]hour/i.test(window)) {
        push(
          "fee_without_exception",
          "Quotes a fee or a 'no fee unless' promise without the 72-hour policy-limits exception the compliance rules require nearby.",
          feeClaim,
        );
      }
    }
  }

  // 5. A written-contract disclosure requirement stated in the rules.
  if (/written contract|in writing|before (?:any )?work begins|disclos/i.test(lower)) {
    const feeMention = content.match(/(our fee|the fee is|fee structure|contingency (?:fee|rate)|retainer fee)/i);
    if (feeMention) {
      const window = content.slice(Math.max(0, (feeMention.index ?? 0) - 1500), (feeMention.index ?? 0) + 2000);
      if (!/(written (?:contract|agreement)|in writing|signed (?:contract|agreement))/i.test(window)) {
        push(
          "fee_without_written_contract",
          "Describes fees without saying they are set out in a written contract signed before work begins.",
          feeMention,
        );
      }
    }
  }

  return { ok: violations.length === 0, violations, inactive: false };
}

/** Repair instruction for the model, listing only what actually tripped. */
export function compliancePrompt(verdict: ComplianceVerdict, rules: string[]): string {
  const lines = [
    "Your draft breaks this venture's legally binding compliance rules. Fix ONLY the passages listed below and return the COMPLETE corrected document, unchanged everywhere else.",
    "",
    "Rules in force:",
    ...rules.map((r) => `- ${r}`),
    "",
    "Violations found:",
  ];
  for (const v of verdict.violations) {
    lines.push(`- ${v.message}`);
    lines.push(`  Offending text: "${v.excerpt}"`);
  }
  lines.push("");
  lines.push("Rewrite those passages so they are accurate and coherent — do not simply delete words or swap a phrase in mid-sentence, which produces broken grammar. Check fenced code blocks, tables and paste-ready email or contract templates too: those count as published copy.");
  return lines.join("\n");
}
