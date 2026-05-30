import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Download a resume from the attendee-docs bucket and extract plain text.
 * Currently supports PDF via `unpdf` (Worker-safe, pure JS).
 * Returns empty string when extraction isn't possible (e.g. DOCX, image-only PDF).
 */
export async function extractTextFromResumeFile(path: string): Promise<{ text: string; reason?: string }> {
  const { data: blob, error } = await supabaseAdmin.storage.from("attendee-docs").download(path);
  if (error || !blob) {
    return { text: "", reason: error?.message ?? "Could not download file" };
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const lower = path.toLowerCase();

  if (lower.endsWith(".pdf")) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
      if (!merged) return { text: "", reason: "PDF appears to be scanned (no embedded text)." };
      return { text: merged };
    } catch (e) {
      return { text: "", reason: e instanceof Error ? e.message : "PDF parsing failed" };
    }
  }

  return {
    text: "",
    reason: "We can read PDFs automatically. For other formats, paste the text below.",
  };
}
