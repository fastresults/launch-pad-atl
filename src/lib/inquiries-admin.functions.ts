// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type InquiryStatus = "new" | "in_progress" | "replied" | "closed";

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

export async function listInquiries(input?: any) {
  const { status, search } = unwrap<{ status?: InquiryStatus | "all"; search?: string }>(input);

  // counts across all statuses
  const { data: allRows } = await supabase.from("inquiries").select("status");
  const counts: Record<string, number> = { new: 0, in_progress: 0, replied: 0, closed: 0 };
  for (const r of allRows ?? []) {
    const k = (r as any).status ?? "unknown";
    counts[k] = (counts[k] ?? 0) + 1;
  }

  let q = supabase
    .from("inquiries")
    .select("*")
    .order("last_activity_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let inquiries = data ?? [];
  if (search) {
    const s = search.toLowerCase();
    inquiries = inquiries.filter(
      (a: any) =>
        (a.name ?? "").toLowerCase().includes(s) ||
        (a.email ?? "").toLowerCase().includes(s) ||
        (a.subject ?? "").toLowerCase().includes(s) ||
        (a.message ?? "").toLowerCase().includes(s),
    );
  }

  return { inquiries, counts };
}

export async function getInquiry(input: any) {
  const { id } = unwrap<{ id: string }>(input);
  if (!id) return { inquiry: null, messages: [] };
  const [inqRes, msgsRes] = await Promise.all([
    supabase.from("inquiries").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("inquiry_messages")
      .select("*")
      .eq("inquiry_id", id)
      .order("created_at", { ascending: true }),
  ]);
  return { inquiry: inqRes.data ?? null, messages: msgsRes.data ?? [] };
}

export async function updateInquiryStatus(input: any) {
  const { id, status } = unwrap<{ id: string; status: InquiryStatus }>(input);
  const { error } = await supabase
    .from("inquiries")
    .update({ status, last_activity_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function replyToInquiry(input: any) {
  const { id, body } = unwrap<{ id: string; body: string }>(input);
  const { error } = await supabase
    .from("inquiry_messages")
    .insert({ inquiry_id: id, direction: "outbound", body });
  if (error) throw new Error(error.message);
  await supabase
    .from("inquiries")
    .update({ status: "replied", last_activity_at: new Date().toISOString() })
    .eq("id", id);
}
