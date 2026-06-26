import { supabase } from "@/integrations/supabase/client";
import type { SlotMap } from "@/components/workshop-slides/slots";
import { slotKey } from "@/components/workshop-slides/slots";

export type DeckOverrideRow = {
  id: string;
  deck_slug: string;
  slide_id: string;
  field: string;
  value_text: string | null;
  value_image_url: string | null;
  value_image_alt: string | null;
  updated_by: string | null;
  updated_at: string;
};

export async function fetchDeckOverrides(deckSlug: string): Promise<SlotMap> {
  const { data, error } = await supabase
    .from("deck_slide_overrides")
    .select("*")
    .eq("deck_slug", deckSlug);
  if (error) throw error;
  const map: SlotMap = {};
  for (const r of (data ?? []) as DeckOverrideRow[]) {
    map[slotKey(r.deck_slug, r.slide_id, r.field)] = {
      text: r.value_text,
      imageUrl: r.value_image_url,
      imageAlt: r.value_image_alt,
    };
  }
  return map;
}

export async function fetchDeckOverrideRows(deckSlug: string) {
  const { data, error } = await supabase
    .from("deck_slide_overrides")
    .select("*")
    .eq("deck_slug", deckSlug);
  if (error) throw error;
  return (data ?? []) as DeckOverrideRow[];
}

export async function saveTextOverride(args: {
  deckSlug: string;
  slideId: string;
  field: string;
  value: string | null;
}) {
  const { data: user } = await supabase.auth.getUser();
  const updated_by = user?.user?.id ?? null;
  if (args.value == null || args.value === "") {
    const { error } = await supabase
      .from("deck_slide_overrides")
      .delete()
      .match({ deck_slug: args.deckSlug, slide_id: args.slideId, field: args.field });
    if (error) throw error;
    return null;
  }
  const { data, error } = await supabase
    .from("deck_slide_overrides")
    .upsert(
      {
        deck_slug: args.deckSlug,
        slide_id: args.slideId,
        field: args.field,
        value_text: args.value,
        value_image_url: null,
        value_image_alt: null,
        updated_by,
      },
      { onConflict: "deck_slug,slide_id,field" },
    )
    .select()
    .single();
  if (error) throw error;
  // best-effort history append
  await supabase.from("deck_slide_override_history").insert({
    deck_slug: args.deckSlug,
    slide_id: args.slideId,
    field: args.field,
    value_text: args.value,
    changed_by: updated_by,
  });
  return data as DeckOverrideRow;
}

export async function saveImageOverride(args: {
  deckSlug: string;
  slideId: string;
  field: string;
  imageUrl: string;
  imageAlt?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  const updated_by = user?.user?.id ?? null;
  const { data, error } = await supabase
    .from("deck_slide_overrides")
    .upsert(
      {
        deck_slug: args.deckSlug,
        slide_id: args.slideId,
        field: args.field,
        value_text: null,
        value_image_url: args.imageUrl,
        value_image_alt: args.imageAlt ?? null,
        updated_by,
      },
      { onConflict: "deck_slug,slide_id,field" },
    )
    .select()
    .single();
  if (error) throw error;
  await supabase.from("deck_slide_override_history").insert({
    deck_slug: args.deckSlug,
    slide_id: args.slideId,
    field: args.field,
    value_image_url: args.imageUrl,
    value_image_alt: args.imageAlt ?? null,
    changed_by: updated_by,
  });
  return data as DeckOverrideRow;
}

export async function resetOverride(args: { deckSlug: string; slideId: string; field: string }) {
  const { error } = await supabase
    .from("deck_slide_overrides")
    .delete()
    .match({ deck_slug: args.deckSlug, slide_id: args.slideId, field: args.field });
  if (error) throw error;
}

export async function resetDeck(deckSlug: string) {
  const { error } = await supabase.from("deck_slide_overrides").delete().eq("deck_slug", deckSlug);
  if (error) throw error;
}

export async function uploadDeckImage(file: File, deckSlug: string, slideId: string, field: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${deckSlug}/${slideId}/${field}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("deck-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("deck-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
  if (signErr) throw signErr;
  return data.signedUrl;
}

export async function generateDeckImageViaAI(args: {
  prompt: string;
  deckSlug: string;
  slideId: string;
  field: string;
  model?: string;
}) {
  const { data, error } = await supabase.functions.invoke<{ url: string }>("deck-image-generate", {
    body: args,
  });
  if (error) throw error;
  if (!data?.url) throw new Error("AI image generation returned no URL");
  return data.url;
}

export async function rewriteDeckCopyViaAI(args: {
  currentText: string;
  tone?: string;
  instruction?: string;
}) {
  const { data, error } = await supabase.functions.invoke<{ variants: string[] }>(
    "deck-copy-rewrite",
    { body: args },
  );
  if (error) throw error;
  return data?.variants ?? [];
}
