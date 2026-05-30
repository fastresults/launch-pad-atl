// Block grouping for the startup brief wizard.
// Client-safe: no server imports.
import { BRIEF_FIELDS } from "@/lib/workflow";

export type BriefBlockId = 1 | 2 | 3 | 4 | 5;
export type BriefBlockKind = "qa" | "founder" | "market";

export type BriefBlock = {
  id: BriefBlockId;
  title: string;
  checkpointHeading: string;
  kind: BriefBlockKind;
  // For "qa" blocks only — keys into BRIEF_FIELDS
  fieldKeys: string[];
};

export const BRIEF_BLOCKS: BriefBlock[] = [
  {
    id: 1,
    title: "Your story",
    checkpointHeading: "Here's what we heard about your story.",
    kind: "qa",
    fieldKeys: ["one_line_pitch", "origin_story", "problem_statement"],
  },
  {
    id: 2,
    title: "Your customer & edge",
    checkpointHeading: "Here's what we heard about your customer and edge.",
    kind: "qa",
    fieldKeys: ["target_customer", "unique_insight", "offer_description"],
  },
  {
    id: 3,
    title: "Your model & vision",
    checkpointHeading: "Here's where you're taking it.",
    kind: "qa",
    fieldKeys: [
      "pricing_idea",
      "business_model",
      "inspiration_brands",
      "twelve_month_vision",
    ],
  },
  {
    id: 4,
    title: "About you",
    checkpointHeading: "Here's the founder picture we have of you.",
    kind: "founder",
    fieldKeys: [],
  },
  {
    id: 5,
    title: "Your market & model",
    checkpointHeading: "Here's the market and model we heard.",
    kind: "market",
    fieldKeys: [],
  },
];

export const QA_BLOCKS = BRIEF_BLOCKS.filter((b) => b.kind === "qa");

export function blockForFieldIndex(idx: number): BriefBlock {
  let cursor = 0;
  for (const b of QA_BLOCKS) {
    cursor += b.fieldKeys.length;
    if (idx < cursor) return b;
  }
  return QA_BLOCKS[QA_BLOCKS.length - 1];
}

export function isLastFieldOfBlock(idx: number): BriefBlock | null {
  let cursor = 0;
  for (const b of QA_BLOCKS) {
    cursor += b.fieldKeys.length;
    if (idx === cursor - 1) return b;
  }
  return null;
}

export function firstIndexOfBlock(blockId: BriefBlockId): number {
  let cursor = 0;
  for (const b of QA_BLOCKS) {
    if (b.id === blockId) return cursor;
    cursor += b.fieldKeys.length;
  }
  return 0;
}

export function fieldLabel(key: string): string {
  return BRIEF_FIELDS.find((f) => f.key === key)?.label ?? key;
}

// Total wizard steps = QA questions + checkpoint per QA block + 2 extra blocks (each = 1 input + 1 checkpoint)
export const TOTAL_BRIEF_STEPS =
  BRIEF_FIELDS.length + QA_BLOCKS.length + (BRIEF_BLOCKS.length - QA_BLOCKS.length) * 2;
