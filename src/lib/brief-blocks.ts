// Block grouping for the startup brief wizard.
// Client-safe: no server imports.
import { BRIEF_FIELDS } from "@/lib/workflow";

export type BriefBlockId = 1 | 2 | 3;

export type BriefBlock = {
  id: BriefBlockId;
  title: string;
  checkpointHeading: string;
  fieldKeys: string[];
};

export const BRIEF_BLOCKS: BriefBlock[] = [
  {
    id: 1,
    title: "Your story",
    checkpointHeading: "Here's what we heard about your story.",
    fieldKeys: ["one_line_pitch", "origin_story", "problem_statement"],
  },
  {
    id: 2,
    title: "Your customer & edge",
    checkpointHeading: "Here's what we heard about your customer and edge.",
    fieldKeys: ["target_customer", "unique_insight", "offer_description"],
  },
  {
    id: 3,
    title: "Your model & vision",
    checkpointHeading: "Here's where you're taking it.",
    fieldKeys: [
      "pricing_idea",
      "business_model",
      "inspiration_brands",
      "twelve_month_vision",
    ],
  },
];

export function blockForFieldIndex(idx: number): BriefBlock {
  let cursor = 0;
  for (const b of BRIEF_BLOCKS) {
    cursor += b.fieldKeys.length;
    if (idx < cursor) return b;
  }
  return BRIEF_BLOCKS[BRIEF_BLOCKS.length - 1];
}

export function isLastFieldOfBlock(idx: number): BriefBlock | null {
  let cursor = 0;
  for (const b of BRIEF_BLOCKS) {
    cursor += b.fieldKeys.length;
    if (idx === cursor - 1) return b;
  }
  return null;
}

export function firstIndexOfBlock(blockId: BriefBlockId): number {
  let cursor = 0;
  for (const b of BRIEF_BLOCKS) {
    if (b.id === blockId) return cursor;
    cursor += b.fieldKeys.length;
  }
  return 0;
}

export function fieldLabel(key: string): string {
  return BRIEF_FIELDS.find((f) => f.key === key)?.label ?? key;
}

// Total wizard steps = questions + checkpoints (one per block)
export const TOTAL_BRIEF_STEPS = BRIEF_FIELDS.length + BRIEF_BLOCKS.length;
