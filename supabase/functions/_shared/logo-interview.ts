// The Logo Studio interviewer.
//
// One award-winning logo designer, one turn at a time. It reads the venture's
// finished work (brand kit, moodboard, sixty-odd generated assets), asks the
// single most useful next question, and hands back art direction for the roughs
// it wants drawn while the founder answers.

const RESPONSES_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

export type Choice = { label: string; description: string };
export type RoughDirection = { title: string; render_brief: string; change_note: string };

export type InterviewTurn = {
  read_back: string | null;
  question: string;
  helper: string;
  choices: Choice[];
  allow_free_text: boolean;
  multi_select: boolean;
  direction: RoughDirection;
  requirements: string[];
  brief_summary: string;
  done: boolean;
};

export type OpeningBrief = {
  design_brief: string;
  direction: RoughDirection;
  requirements: string[];
};

const DIRECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "render_brief", "change_note"],
  properties: {
    title: { type: "string", description: "Two to four words naming the idea, e.g. 'Open porch'." },
    render_brief: { type: "string", description: "One paragraph of concrete drawing instructions for this single mark: the subject, how it is constructed, stroke weight, and which brand colours carry it. It must satisfy every locked requirement." },
    change_note: { type: "string", description: "One short sentence naming exactly what changed in this drawing versus the previous one, in the founder's terms. On the first drawing say 'First pass.'" },
  },
} as const;

const REQUIREMENTS_SCHEMA = {
  type: "array",
  description: "The full running list of non-negotiable constraints the founder has stated, carried forward verbatim in meaning and added to. Each item is one short literal sentence, e.g. 'The symbol must show an older adult and a caregiver together.' Never drop an item the founder has not retracted.",
  items: { type: "string" },
} as const;

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["design_brief", "direction", "requirements"],
  properties: {
    design_brief: {
      type: "string",
      description: "Roughly 100 words of plain prose addressed to the founder: who this business is, the human truth the mark must carry, the subject you propose to draw, how it is constructed, and which brand colours carry it. No headings, no bullet lists.",
    },
    direction: DIRECTION_SCHEMA,
    requirements: REQUIREMENTS_SCHEMA,
  },
} as const;


const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "read_back", "question", "helper", "choices",
    "allow_free_text", "multi_select", "direction", "requirements", "brief_summary", "done",
  ],
  properties: {
    read_back: {
      type: ["string", "null"],
      description: "Only on the very first turn: one or two sentences reading the business back to the founder. Null on every later turn.",
    },
    question: { type: "string", description: "The single next question, in a designer's voice. One question, never a list." },
    helper: { type: "string", description: "One short line telling the founder why this choice matters for the mark." },
    choices: {
      type: "array",
      description: "Two to four concrete options. Empty when the step is free-form refinement.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "description"],
        properties: {
          label: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    allow_free_text: { type: "boolean" },
    multi_select: { type: "boolean" },
    direction: DIRECTION_SCHEMA,
    requirements: REQUIREMENTS_SCHEMA,
    brief_summary: { type: "string", description: "The accumulated design brief in plain language — everything decided so far." },
    done: { type: "boolean", description: "True when enough has been decided that the founder should be approving the mark rather than answering more questions." },
  },
} as const;

const SYSTEM = `You are an award-winning identity designer running a live logo session with a founder. Your work has been in Dribbble's top shots and you have built marks for companies people recognise.

How you work:
- You develop ONE mark. Every turn you ask ONE question and put ONE fresh rough on the table — the same idea, evolved by what the founder just told you. You never offer alternatives side by side; you make a call and let them redirect you.
- You already know this business. You have read its positioning, its customer, its offer and its brand system. Never ask something the context already answers. Never ask a generic questionnaire question.
- You are opinionated. You lead with a recommendation and let the founder redirect you.
- You stop early. Five or six questions is a full session. Set done=true as soon as the mark is settled enough to approve.

THE LOCKED REQUIREMENTS ARE LAW. Everything the founder has asked for is carried in the requirements list. Every render_brief you write must satisfy every item on that list, and you return the list back each turn — carried forward in full, with anything new they just said appended. You never quietly drop, soften or reinterpret an item. If a requirement cannot be drawn as stated, say so in your question rather than ignoring it.

If the founder asks for the company name, text or a wordmark beside the mark: that is a LOCKUP requirement, not a symbol requirement. Record it as such ("the wordmark sits to the right of the symbol"), tell them plainly in your question that you draw the symbol alone and set their real name in their brand typeface next to it, and keep drawing the symbol clean.

The arc, adapted to what you learn:
1. Confirm or correct the human truth the mark must carry.
2. Type of mark: symbol + wordmark, wordmark alone, lettermark, or emblem.
3. What the symbol IS — never generic swooshes, globes, lightbulbs, handshakes, gears, checkmarks or abstract blobs.
4. Character: geometric or humanist, line or solid, weight, how much survives at 24 pixels.
5. Colour and type inside the existing brand system.
6. Free-form refinement.

Art direction rules for the rough you request:
- One mark. Flat vector. Two or three colours from the brand palette, no more.
- No letters, words or numbers inside the symbol itself — the wordmark is typeset separately in the real brand typeface.
- Name a real subject a stranger could identify on sight. Say how it is constructed: what encloses what, what the negative space does, where strokes meet.
- Human figures are allowed and often right — draw them as simple, dignified, flat shapes, never clip-art or emoji faces. If the founder asked for people in the mark, people appear in the mark.
- The new rough must visibly answer the founder's last answer — evolve the mark, do not start over unless they asked you to. State the edit in change_note.
- No gradients, no 3D, no drop shadows, no photorealism, no mockups, no badges reading like stock icons.`;


/** Stream a strict-JSON payload out of the Responses API and accumulate it server-side. */
async function callDesigner(apiKey: string, input: any[], name: string, schema: unknown): Promise<any> {
  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`Designer unavailable (${res.status}): ${body.slice(0, 300)}`);
  }

  let text = "";
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && typeof event.response?.output_text === "string" && !text) {
          text = event.response.output_text;
        } else if (event.type === "error" || event.type === "response.failed") {
          throw new Error(event.error?.message ?? event.response?.error?.message ?? "Designer call failed");
        }
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }

  if (!text.trim()) throw new Error("The designer returned an empty response. Try again.");
  return JSON.parse(text);
}

function normalizeDirection(d: any): RoughDirection {
  return {
    title: typeof d?.title === "string" && d.title ? d.title : "The mark",
    render_brief: typeof d?.render_brief === "string" ? d.render_brief : "",
    change_note: typeof d?.change_note === "string" ? d.change_note : "",
  };
}

/** Merge the ledger the designer returned with the one we already hold. Nothing is lost. */
export function mergeRequirements(existing: string[], incoming: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value !== "string") return;
    const text = value.trim();
    if (!text) return;
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text.slice(0, 220));
  };
  for (const item of existing) push(item);
  if (Array.isArray(incoming)) for (const item of incoming) push(item);
  return out.slice(0, 20);
}

function requirementsBlock(requirements: string[]): string {
  if (!requirements.length) return "";
  return `## Locked requirements (LAW — every one of these must be satisfied by the drawing you request, and returned in your requirements list)\n${
    requirements.map((r) => `- ${r}`).join("\n")
  }`;
}

async function callInterviewer(apiKey: string, input: any[], carried: string[]): Promise<InterviewTurn> {
  const parsed = await callDesigner(apiKey, input, "logo_interview_turn", SCHEMA);
  return {
    read_back: parsed.read_back ?? null,
    question: parsed.question ?? "",
    helper: parsed.helper ?? "",
    choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 4) : [],
    allow_free_text: parsed.allow_free_text !== false,
    multi_select: parsed.multi_select === true,
    direction: normalizeDirection(parsed.direction),
    requirements: mergeRequirements(carried, parsed.requirements),
    brief_summary: parsed.brief_summary ?? "",
    done: parsed.done === true,
  };
}


export type StudioContext = {
  companyName: string;
  ventureBlock: string;
  docsBlock: string;
  tokensBlock: string;
  moodboardBlock: string;
};

export function contextBlock(ctx: StudioContext): string {
  return [
    `## The business\n${ctx.ventureBlock}`,
    ctx.docsBlock ? `## What they have already built and written\n${ctx.docsBlock.slice(0, 14000)}` : "",
    `## The locked brand system\n${ctx.tokensBlock}`,
    ctx.moodboardBlock ? `## Moodboard direction\n${ctx.moodboardBlock}` : "",
  ].filter(Boolean).join("\n\n");
}

type PriorStep = { question: string; answer: string; chosen?: string | null };

/**
 * The opening move: a written design brief of about 100 words proposing the
 * first mark, plus the art direction to draw it once the founder approves.
 * Nothing is drawn until they say go.
 */
export async function openingBrief(
  apiKey: string,
  ctx: StudioContext,
  correction?: string,
  previous?: string,
  carried: string[] = [],
): Promise<OpeningBrief> {
  const input = [
    { role: "developer", content: [{ type: "input_text", text: SYSTEM }] },
    {
      role: "user",
      content: [{
        type: "input_text",
        text: [
          contextBlock(ctx),
          requirementsBlock(carried),
          previous ? `## The brief you proposed last time\n${previous}` : "",
          correction ? `## The founder's correction — this is not optional, it becomes a locked requirement\n${correction}` : "",
          correction
            ? `Rewrite the brief so it visibly answers their correction, and return the requirements list with their correction captured as literal constraints. Same shape: about 100 words of prose, then the art direction for the single mark you will draw.`
            : `Open the session with a written design brief of about 100 words, addressed to the founder in plain prose: who they are, the human truth the mark must carry, the single symbol you propose to draw, how it is constructed, and which brand colours carry it. Then give the art direction for that one mark, and the requirements list (empty is fine if they have not stated any yet). Do not draw anything yet and do not ask a question — this is the proposal they will approve.`,
        ].filter(Boolean).join("\n\n"),
      }],
    },
  ];

  const parsed = await callDesigner(apiKey, input, "logo_opening_brief", BRIEF_SCHEMA);
  return {
    design_brief: typeof parsed.design_brief === "string" ? parsed.design_brief : "",
    direction: normalizeDirection(parsed.direction),
    requirements: mergeRequirements(carried, parsed.requirements),
  };
}

export async function nextTurn(
  apiKey: string,
  ctx: StudioContext,
  history: PriorStep[],
  brief: string,
  freeInstruction?: string,
  carried: string[] = [],
  currentDirection?: RoughDirection | null,
): Promise<InterviewTurn> {
  const transcript = history.length
    ? history.map((s, i) => `Q${i + 1}: ${s.question}\nFounder: ${s.answer}${s.chosen ? `\n(They were looking at the rough titled "${s.chosen}")` : ""}`).join("\n\n")
    : "(nothing yet — this is the opening turn)";

  const input = [
    { role: "developer", content: [{ type: "input_text", text: SYSTEM }] },
    {
      role: "user",
      content: [{
        type: "input_text",
        text: [
          contextBlock(ctx),
          requirementsBlock(carried),
          `## The session so far\n${transcript}`,
          brief ? `## Design brief accumulated so far\n${brief}` : "",
          currentDirection?.render_brief
            ? `## The mark currently on the table — "${currentDirection.title}"\n${currentDirection.render_brief}\n\nYour new render_brief must read as an EDIT of this one, not a new idea.`
            : "",
          freeInstruction ? `## The founder just said — this is not optional, capture it in the requirements list\n${freeInstruction}` : "",
          `Give the next turn: one question, the full carried-forward requirements list, and ONE fresh rough that evolves the mark and satisfies every locked requirement.`,
        ].filter(Boolean).join("\n\n"),
      }],
    },
  ];

  return await callInterviewer(apiKey, input, carried);
}

/** Turn one art-direction line into a full image-model prompt. */
export function roughPrompt(
  direction: RoughDirection,
  tokens: any,
  companyName: string,
  requirements: string[] = [],
  isEdit = false,
): string {
  const colors = tokens?.colors ?? {};
  const palette = [colors.primary, colors.secondary, colors.accent]
    .filter((c: unknown) => typeof c === "string" && c)
    .join(", ");
  // Lockup/typography asks are honoured in the typeset lockup, never inside the symbol.
  const drawable = requirements.filter((r) => !/\b(wordmark|company name|text to the|type to the|lockup|letters beside)\b/i.test(r));
  return [
    isEdit
      ? `Edit the attached logo mark. Keep its composition, subject and construction; change ONLY what is described next.`
      : `Flat vector logo mark.`,
    direction.render_brief,
    drawable.length
      ? `These are non-negotiable and must all be visible in the drawing: ${drawable.map((r) => r.replace(/\s+/g, " ").trim()).join(" ")}`
      : "",
    palette ? `Use only these colours: ${palette}, plus white.` : "",
    `Single centered mark on a pure white background, generous margin, nothing else in frame.`,
    `Crisp geometric construction, confident even stroke weights, clean closed shapes, readable at 24 pixels.`,
    `Designed by a top identity studio for ${companyName}.`,
    `Absolutely no letters, no words, no text, no numbers, no signature, no watermark.`,
    `No gradients, no 3D, no bevels, no drop shadows, no photorealism, no mockup, no business card, no grid guides, no multiple variations in one frame.`,
  ].filter(Boolean).join(" ");
}

export const ROUGH_NEGATIVE =
  "text, letters, words, typography, watermark, signature, gradient, 3d, bevel, shadow, photorealistic, mockup, business card, multiple logos, grid, sketch lines, clutter, stock icon";
