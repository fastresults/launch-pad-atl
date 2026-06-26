import { BRIEF_FIELDS, type BriefKey } from "@/lib/workflow";

export const BRIEF_TOTAL = BRIEF_FIELDS.length;

export function countAnsweredBriefFields(brief: Record<string, unknown> | null | undefined): number {
  if (!brief) return 0;
  let n = 0;
  for (const f of BRIEF_FIELDS) {
    const v = (brief as Record<string, unknown>)[f.key];
    if (typeof v === "string" && v.trim().length > 0) n += 1;
  }
  return n;
}

export const BRIEF_FIELD_KEYS: BriefKey[] = BRIEF_FIELDS.map((f) => f.key as BriefKey);
