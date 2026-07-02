// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type LegalSetupProgress = {
  id: string;
  user_id: string;
  snapshot_id: string | null;
  entity_choice: string | null;
  entity_state: string | null;
  business_name: string | null;
  name_reserved: boolean;
  registered_agent_choice: string | null;
  registered_agent_name: string | null;
  registered_agent_service: string | null;
  articles_filed_at: string | null;
  articles_control_number: string | null;
  ein: string | null;
  ein_obtained_at: string | null;
  operating_agreement_generated_at: string | null;
  operating_agreement_markdown: string | null;
  steps_completed: Record<string, boolean>;
  notes: string | null;
  updated_at: string;
};

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) throw new Error("Not signed in");
  return data.user.id;
}

export async function getMyLegalSetup(): Promise<LegalSetupProgress | null> {
  const userId = await uid();
  const { data, error } = await supabase
    .from("legal_setup_progress")
    .select("*")
    .eq("user_id", userId)
    .is("snapshot_id", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as LegalSetupProgress | null;
}

export async function upsertMyLegalSetup(
  patch: Partial<LegalSetupProgress>,
): Promise<LegalSetupProgress> {
  const userId = await uid();
  const existing = await getMyLegalSetup();
  if (existing) {
    const { data, error } = await supabase
      .from("legal_setup_progress")
      .update(patch)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as LegalSetupProgress;
  }
  const { data, error } = await supabase
    .from("legal_setup_progress")
    .insert({ user_id: userId, snapshot_id: null, ...patch })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LegalSetupProgress;
}

export async function toggleLegalStep(stepKey: string, done: boolean): Promise<LegalSetupProgress> {
  const current = await getMyLegalSetup();
  const steps = { ...(current?.steps_completed ?? {}), [stepKey]: done };
  return upsertMyLegalSetup({ steps_completed: steps });
}

export async function generateOperatingAgreement(): Promise<{ markdown: string }> {
  const { data, error } = await supabase.functions.invoke("venture-generate-operating-agreement", {
    body: {},
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as { markdown: string };
}
