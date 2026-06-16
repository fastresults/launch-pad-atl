import { supabase } from "@/integrations/supabase/client";

export async function submitInquiry(data: { name: string; email: string; phone?: string; subject: string; message: string; website?: string }) {
  if (data.website) return;
  const { error } = await supabase.from("inquiries").insert({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    subject: data.subject,
    message: data.message,
  });
  if (error) throw new Error(error.message);
}
