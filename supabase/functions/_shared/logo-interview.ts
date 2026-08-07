// The Logo Studio interviewer.
//
// One award-winning logo designer, one turn at a time. It reads the venture's
// finished work (brand kit, moodboard, sixty-odd generated assets), asks the
// single most useful next question, and hands back art direction for the roughs
// it wants drawn while the founder answers.

const RESPONSES_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

export type Choice = { label: string; description: string };
export type RoughDirection = { title: string; render_brief: string };

export type InterviewTurn = {
  read_back: string | null;
  question: string;
  helper: string;
  choices: Choice[];
  allow_free_text: boolean;
  multi_select: boolean;
  art_direction: RoughDirection[];
  brief_summary: string;
  done: boolean;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "read_back", "question", "helper", "choices",
    "allow_free_text", "multi_select", "art_direction", "brief_summary", "done",
  ],
  properties: {
    read_back: {
      type: ["string", "null"],
      description: "Only on the very first turn: one or two sentences reading the business back to the founder and naming the human truth the mark should carry. Null on every later turn.",
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
    art_direction: {
      type: "array",
      description: "Exactly three roughs to draw right now, reflecting everything decided so far. Each render_brief describes ONE mark in concrete visual terms: the subject, how it is constructed, stroke weight, and which brand colours carry it.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "render_brief"],
        properties: {
          title: { type: "string", description: "Two to four words naming the idea, e.g. 'Open porch'." },
          render_brief: { type: "string", description: "One paragraph of concrete drawing instructions for this single mark." },
        },
      },
    },
    brief_summary: { type: "string", description: "The accumulated design brief in plain language — everything decided so far." },
    done: { type: "boolean", description: "True when enough has been decided that the founder should be choosing a final mark rather than answering more questions." },
  },
} as const;

const SYSTEM = `You are an award-winning identity designer running a live logo session with a founder. Your work has been in Dribbble's top shots and you have built marks for companies people recognise.

How you work:
- You draw while you talk. Every turn you ask ONE question and simultaneously put three fresh roughs on the table that reflect everything decided so far.
- You already know this business. You have read its positioning, its customer, its offer and its brand system. Never ask something the context already answers. Never ask a generic questionnaire question.
- You are opinionated. You lead with a recommendation and let the founder redirect you.
- You stop early. Five or six questions is a full session. Set done=true as soon as the direction is settled enough to pick a final mark.

The arc, adapted to what you learn:
1. Read the business back and name the human truth the mark must carry. Ask them to confirm or correct it.
2. Type of mark: symbol + wordmark, wordmark alone, lettermark, or emblem.
3. What the symbol IS — two or three candidate subjects drawn from this specific business, each with a one-line reason. Never generic swooshes, globes, lightbulbs, handshakes, gears, checkmarks or abstract blobs.
4. Character: geometric or humanist, line or solid, weight, how much survives at 24 pixels.
5. Colour and type inside the existing brand system.
6. Free-form refinement.

Art direction rules for every rough you request:
- One mark per rough. Flat vector. Two or three colours from the brand palette, no more.
- NEVER put letters, words or text in a rough. The wordmark is set separately in the real brand typeface.
- Name a real subject a stranger could identify on sight. Say how it is constructed: what encloses what, what the negative space does, where strokes meet.
- The three roughs on a turn must be genuinely different ideas, not three weights of the same shape.
- No gradients, no 3D, no drop shadows, no photorealism, no mockups, no badges reading like stock icons.`;

/** Stream a strict-JSON turn out of the Responses API and accumulate it server-side. */
async function callInterviewer(apiKey: string, input: any[]): Promise<InterviewTurn> {
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
      text: {
        format: {
          type: "json_schema",
          name: "logo_interview_turn",
          strict: true,
          schema: SCHEMA,
        },
      },
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

  if (!text.trim()) throw new Error("The designer returned an empty turn. Try again.");
  const parsed = JSON.parse(text) as InterviewTurn;
  return {
    read_back: parsed.read_back ?? null,
    question: parsed.question ?? "",
    helper: parsed.helper ?? "",
    choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 4) : [],
    allow_free_text: parsed.allow_free_text !== false,
    multi_select: parsed.multi_select === true,
    art_direction: Array.isArray(parsed.art_direction) ? parsed.art_direction.slice(0, 3) : [],
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

export async function nextTurn(
  apiKey: string,
  ctx: StudioContext,
  history: PriorStep[],
  brief: string,
  freeInstruction?: string,
): Promise<InterviewTurn> {
  const transcript = history.length
    ? history.map((s, i) => `Q${i + 1}: ${s.question}\nFounder: ${s.answer}${s.chosen ? `\n(They pointed at the rough titled "${s.chosen}")` : ""}`).join("\n\n")
    : "(nothing yet — this is the opening turn)";

  const input = [
    { role: "developer", content: [{ type: "input_text", text: SYSTEM }] },
    {
      role: "user",
      content: [{
        type: "input_text",
        text: [
          contextBlock(ctx),
          `## The session so far\n${transcript}`,
          brief ? `## Design brief accumulated so far\n${brief}` : "",
          freeInstruction ? `## The founder just said\n${freeInstruction}` : "",
          history.length === 0
            ? `Open the session: read this business back in one or two sentences, name the human truth the mark should carry, ask them to confirm or correct it, and put three opening roughs on the table.`
            : `Give the next turn: one question plus three fresh roughs reflecting everything decided.`,
        ].filter(Boolean).join("\n\n"),
      }],
    },
  ];

  return await callInterviewer(apiKey, input);
}

/** Turn one art-direction line into a full image-model prompt. */
export function roughPrompt(direction: RoughDirection, tokens: any, companyName: string): string {
  const colors = tokens?.colors ?? {};
  const palette = [colors.primary, colors.secondary, colors.accent]
    .filter((c: unknown) => typeof c === "string" && c)
    .join(", ");
  return [
    `Flat vector logo mark. ${direction.render_brief}`,
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
