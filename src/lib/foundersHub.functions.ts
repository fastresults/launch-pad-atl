// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

async function uid() {
  const u = (await supabase.auth.getUser()).data.user;
  if (!u) throw new Error("Not signed in");
  return u.id;
}

export type SnapshotStatus = "input" | "enriching" | "review" | "generating" | "complete" | "archived";

export interface VentureSnapshot {
  id: string;
  user_id: string;
  company_name: string | null;
  website_url: string | null;
  business_concept: string | null;
  differentiation_statement: string | null;
  founder_name: string | null;
  founder_email: string | null;
  founder_phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  market_scope: "local" | "regional" | "national" | "international" | null;
  industry: string | null;
  sub_industry: string | null;
  scraped_content: string | null;
  competitor_data: any;
  market_research: string | null;
  extracted_data: any;
  research_artifacts: any[] | null;
  research_brief: any;
  status: SnapshotStatus;
  enrichment_progress: { stage?: string; progress?: number; message?: string; updatedAt?: string } | null;
  concept_summary: string | null;
  value_proposition: string | null;
  concept_status: "draft" | "refining" | "locked";
  concept_locked_at: string | null;
  concept_iterations: any[];
  epiphany_runs: any[];
  saved_enhancements: any[];
  brand_tokens: any;
  created_at: string;
  updated_at: string;
}

export interface VentureDocumentType {
  type: string;
  name: string;
  description: string;
  category: string;
  sort_order: number;
  dependencies: string[];
  estimated_minutes: number;
  icon: string | null;
  free_tier: boolean;
}

export interface VentureDocument {
  id: string;
  snapshot_id: string;
  document_type: string;
  status: "pending" | "generating" | "complete" | "failed";
  content: string | null;
  word_count: number | null;
  quality_score: number | null;
  version: number;
  metadata: any;
  content_version_history: any[];
  updated_at: string;
}

export async function listSnapshots(): Promise<VentureSnapshot[]> {
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("user_id", await uid())
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureSnapshot[];
}

export async function setFavorite(input: any): Promise<void> {
  const { id, is_favorite } = unwrap<{ id: string; is_favorite: boolean }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ is_favorite })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function unarchiveSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  // Decide where to restore to: complete if any docs exist, else review if extracted_data, else enriching
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("extracted_data")
    .eq("id", id)
    .maybeSingle();
  const { count: docCount } = await supabase
    .from("venture_documents")
    .select("id", { count: "exact", head: true })
    .eq("snapshot_id", id)
    .eq("status", "complete");
  const nextStatus =
    (docCount ?? 0) > 0
      ? "complete"
      : snap?.extracted_data && Object.keys(snap.extracted_data).length > 0
        ? "review"
        : "enriching";
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ status: nextStatus })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSnapshot(input: any): Promise<VentureSnapshot | null> {
  const { id } = unwrap<{ id: string }>(input);
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as VentureSnapshot | null;
}

export async function createSnapshot(input: any): Promise<{ id: string }> {
  const {
    company_name,
    website_url,
    business_concept,
    differentiation_statement,
    founder_name,
    founder_email,
    founder_phone,
    city,
    region,
    country,
    market_scope,
    industry,
    sub_industry,
  } = unwrap<{
    company_name?: string;
    website_url?: string;
    business_concept: string;
    differentiation_statement?: string;
    founder_name?: string;
    founder_email?: string;
    founder_phone?: string;
    city?: string;
    region?: string;
    country?: string;
    market_scope?: "local" | "regional" | "national" | "international";
    industry?: string;
    sub_industry?: string;
  }>(input);

  const { data, error } = await supabase
    .from("venture_snapshots")
    .insert({
      user_id: await uid(),
      company_name: company_name ?? null,
      website_url: website_url ?? null,
      business_concept,
      differentiation_statement: differentiation_statement ?? null,
      founder_name: founder_name ?? null,
      founder_email: founder_email ?? null,
      founder_phone: founder_phone ?? null,
      city: city ?? null,
      region: region ?? null,
      country: country ?? null,
      market_scope: market_scope ?? null,
      industry: industry ?? null,
      sub_industry: sub_industry ?? null,
      status: "enriching",
      enrichment_progress: { stage: "queued", progress: 0, message: "Queued", updatedAt: new Date().toISOString() },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Fire-and-forget deep research enrichment
  void supabase.functions.invoke("venture-deep-research", { body: { snapshotId: data.id } });

  return { id: data.id };
}

export async function updateFounderContext(input: any): Promise<void> {
  const { id, ...patch } = unwrap<{
    id: string;
    founder_name?: string;
    founder_email?: string;
    founder_phone?: string;
    city?: string;
    region?: string;
    country?: string;
    market_scope?: string;
    industry?: string;
    sub_industry?: string;
  }>(input);
  const { error } = await supabase.from("venture_snapshots").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateExtractedData(input: any): Promise<void> {
  const { id, extracted_data } = unwrap<{ id: string; extracted_data: any }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ extracted_data, status: "review" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function advanceToGenerate(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ status: "generating" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function archiveSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSnapshot(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase.from("venture_snapshots").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function retryEnrichment(input: any): Promise<void> {
  const { id } = unwrap<{ id: string }>(input);
  const { error } = await supabase
    .from("venture_snapshots")
    .update({
      status: "enriching",
      enrichment_progress: { stage: "queued", progress: 0, message: "Retrying", updatedAt: new Date().toISOString() },
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  void supabase.functions.invoke("venture-deep-research", { body: { snapshotId: id } });
}

export async function listDocumentTypes(): Promise<VentureDocumentType[]> {
  const { data, error } = await supabase
    .from("venture_document_types")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureDocumentType[];
}

export async function listSnapshotDocuments(input: any): Promise<VentureDocument[]> {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_documents")
    .select("*")
    .eq("snapshot_id", snapshotId);
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureDocument[];
}

export async function generateDocument(input: any): Promise<void> {
  const { snapshotId, documentType } = unwrap<{ snapshotId: string; documentType: string }>(input);
  const { data, error } = await supabase.functions.invoke("venture-generate-document", {
    body: { snapshotId, documentType },
  });
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw new Error(data.error ?? "Generation failed");
}

export async function bulkGenerate(input: any): Promise<void> {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { error } = await supabase.functions.invoke("venture-bulk-generate", {
    body: { snapshotId },
  });
  if (error) throw new Error(error.message);
}

export async function getActiveJob(input: any) {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_generation_jobs")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function cancelJob(input: any): Promise<void> {
  const { jobId } = unwrap<{ jobId: string }>(input);
  const { error } = await supabase
    .from("venture_generation_jobs")
    .update({ cancel_requested: true })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function listFailures(input: any) {
  const { snapshotId } = unwrap<{ snapshotId: string }>(input);
  const { data, error } = await supabase
    .from("venture_generation_failures")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Admin
export async function adminListSnapshots() {
  const { data, error } = await supabase
    .from("venture_snapshots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as VentureSnapshot[];
}

// Concept refinement gateway
export async function refineConcept(input: any): Promise<any> {
  const { snapshotId, action, payload } = unwrap<{ snapshotId: string; action: string; payload?: any }>(input);
  const { data, error } = await supabase.functions.invoke("venture-concept-refine", {
    body: { snapshot_id: snapshotId, action, payload },
  });
  if (error) {
    // Surface gateway-side message when present
    const msg = (data as any)?.error || error.message;
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export async function generateBrandAsset(input: any): Promise<any> {
  const { snapshotId, kind, count, extra } = unwrap<{ snapshotId: string; kind: string; count?: number; extra?: string }>(input);
  const { data, error } = await supabase.functions.invoke("venture-brand-assets", {
    body: { snapshotId, kind, count, extra },
  });
  if (error) {
    const msg = (data as any)?.error || error.message;
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}


