/**
 * The shared cinematic recipe behind every workshop hero image. Kept in sync
 * with the same constants in src/lib/workshop-pains.ts so a regeneration from
 * Super Admin produces a picture that matches the shipped set.
 */
export const SCENE_BASE =
  "Cinematic editorial photograph, midnight-navy color grade, deep shadows, single warm practical light source, shallow depth of field, 50mm lens, natural film grain, realistic skin texture, unposed and documentary in feel";

export const NO_SCREEN_CONTENT = "no text, no logos, no readable UI copy";

export const SCREEN_CONTENT =
  "on-screen content is recognizable by shape only — tiles, rows, blocks, charts, placeholders — with all text rendered as soft illegible blur, no logos, no brand marks, never legible words";

export const SCENE_TAIL = "Generated on the premium image tier at 1920x1080";

/** Wraps a subject in the shared hero look so every set matches. */
export function scenePrompt(subject: string, opts: { screens?: boolean } = {}): string {
  const rule = opts.screens ? SCREEN_CONTENT : NO_SCREEN_CONTENT;
  return `${subject}. ${SCENE_BASE}, ${rule}. ${SCENE_TAIL}.`;
}
