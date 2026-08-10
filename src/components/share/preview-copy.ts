import type { ShareImage } from "@/lib/venture-share.functions";

/** Marker so a stale showcase bundle is obvious at a glance in the console. */
export const SHARE_UI_VERSION = "showcase-ui/2026-08-10-rich-preview";

export type PreviewField = { id: string; label: string; text: string };

export type PreviewCopy = {
  eyebrow: string | null;
  headline: string;
  pillar: string | null;
  fields: PreviewField[];
  caption: string;
  /** True when the creative genuinely ships without post copy. */
  artworkOnly: boolean;
};

/**
 * Everything the preview modal shows for one creative, derived in one place so
 * the copy panel can never quietly collapse to an image-only dialog.
 */
export function buildPreviewCopy(image: ShareImage | null, fallbackTitle: string): PreviewCopy {
  const meta = image?.meta ?? null;
  const headline = meta?.headline ?? image?.label ?? fallbackTitle;
  const hashtags = meta?.hashtags?.length ? meta.hashtags.join(" ") : null;

  const eyebrow =
    [meta?.platform, meta?.week ? `Week ${meta.week}` : null, meta?.day, meta?.aspect]
      .filter(Boolean)
      .join(" · ") || null;

  const fields: PreviewField[] = [];
  if (headline) fields.push({ id: "headline", label: "Headline", text: headline });
  if (meta?.hook && meta.hook !== headline) fields.push({ id: "hook", label: "Hook", text: meta.hook });
  if (meta?.body) fields.push({ id: "body", label: "Post copy", text: meta.body });
  if (meta?.cta) fields.push({ id: "cta", label: "Call to action", text: meta.cta });
  if (hashtags) fields.push({ id: "tags", label: "Hashtags", text: hashtags });

  const caption = [
    meta?.hook && meta.hook !== headline ? meta.hook : null,
    meta?.body ?? null,
    meta?.cta ?? null,
    hashtags,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    eyebrow,
    headline,
    pillar: meta?.pillar ?? null,
    fields,
    caption,
    artworkOnly: !meta?.body && !meta?.hook && !meta?.cta && !hashtags,
  };
}
