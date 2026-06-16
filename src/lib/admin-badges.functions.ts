import { supabase } from "@/integrations/supabase/client";

export interface AdminBadges {
  applicationsPending: number;
  membersPending: number;
  reviewPending: number;
  inquiriesNew: number;
}

export async function getAdminBadges(): Promise<AdminBadges> {
  const [apps, members, reviews, inquiries] = await Promise.all([
    supabase.from("founder_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("member_intakes").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("member_intakes").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return {
    applicationsPending: apps.count ?? 0,
    membersPending: members.count ?? 0,
    reviewPending: reviews.count ?? 0,
    inquiriesNew: inquiries.count ?? 0,
  };
}
