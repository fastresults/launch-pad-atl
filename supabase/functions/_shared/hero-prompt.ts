// Shared hero-image prompt builder so every document surface (Founders Hub
// venture_documents AND attendee workflow deliverables) generates Nano Banana
// images in the same New Yorker editorial style. Keep all style edits here.

export function stripMarkdown(md: string): string {
  return (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface VisualPromptOptions {
  docTitle: string;
  docType: string;
  contentSnippet: string;
  companyName?: string | null;
  industry?: string | null;
  brandTokens?: any;
}

export function buildVisualPrompt(opts: VisualPromptOptions): string {
  const { docTitle, docType, contentSnippet, companyName, industry } = opts;
  return [
    `Create a 16:9 editorial illustration in the style of a New Yorker magazine cover or contents-page illustration, conceptually representing a business document titled "${docTitle}" (type: ${docType}).`,
    companyName ? `Company: ${companyName}.` : "",
    industry ? `Industry: ${industry}.` : "",
    `The image should illustrate the core ideas in this document summary using a witty, restrained business metaphor: ${contentSnippet}`,
    `Style: New Yorker magazine editorial illustration. Hand-drawn conceptual artwork with confident ink linework and flat, painterly gouache or watercolor shading. Limited muted corporate palette — cream paper background, soft navy, muted ochre, brick red, sage green. Recognizable real-world objects (briefcases, paper documents, hands, office plants, ladders, doors, paper boats, desks, coffee cups, chairs) arranged to illustrate the concept. Clean negative space, single clear focal point, slightly off-center composition. Sophisticated, understated, intelligent — looks like it belongs in a serious print magazine.`,
    `STRICT RULES: NO 3D render, NO photorealism, NO neon, NO glowing particles, NO holograms, NO robot arms, NO sci-fi imagery, NO purple/cyan glow effects, NO abstract energy fields, NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks, NO UI mockups, NO data charts. 16:9 horizontal composition.`,
  ].filter(Boolean).join(" ");
}
