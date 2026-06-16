import { supabase } from "@/integrations/supabase/client";

export interface AdminBadges {
  pendingApplications: number;
  pendingRegistrations: number;
  pendingReviews: number;
  openInquiries: number;
}

export async function getAdminBadges(): Promise<AdminBadges> {
  const [apps, regs, reviews, inquiries] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact" }).eq("status", "pending"),
    supabase.from("workshop_registrations").select("id", { count: "exact" }).eq("status", "pending"),
    supabase.from("members").select("id", { count: "exact" }).eq("member_status", "pending"),
    supabase.from("inquiries").select("id", { count: "exact" }).eq("status", "open"),
  ]);
  return {
    pendingApplications: apps.count ?? 0,
    pendingRegistrations: regs.count ?? 0,
    pendingReviews: reviews.count ?? 0,
    openInquiries: inquiries.count ?? 0,
  };
}
