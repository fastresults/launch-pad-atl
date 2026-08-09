import { supabase } from "@/integrations/supabase/client";
import { getWorkshopAudit } from "@/lib/workshop-audit";
import { getWorkshopPains } from "@/lib/workshop-pains";
import { getCatalogWorkshop } from "@/lib/workshop-catalog";
import { getSessionUser } from "@/lib/effective-user";

export type AuditIntakeRow = {
  id: string;
  user_id: string;
  workshop_slug: string;
  session_start: string | null;
  answers: Record<string, string>;
  file_urls: string[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditItem = {
  painId: string;
  grade: string;
  finding: string;
  cost: string;
  inTheRoom: string;
};

export type AuditReport = {
  overallGrade?: string;
  summary?: string;
  prescribedOutcome?: string;
  items?: AuditItem[];
};

export type AuditRow = {
  id: string;
  user_id: string;
  intake_id: string | null;
  workshop_slug: string;
  status: "pending" | "generated" | "approved" | "sent";
  report: AuditReport | null;
  overall_grade: string | null;
  prescribed_outcome: string | null;
  admin_notes: string | null;
  model: string | null;
  generated_at: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
};

const INTAKES = "workshop_audit_intakes";
const AUDITS = "workshop_audits";

export async function getMyIntake(slug: string): Promise<AuditIntakeRow | null> {
  const uid = (await getSessionUser())?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from(INTAKES)
    .select("*")
    .eq("user_id", uid)
    .eq("workshop_slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as AuditIntakeRow) ?? null;
}

export async function saveMyIntake(input: {
  slug: string;
  answers: Record<string, string>;
  submit?: boolean;
}): Promise<AuditIntakeRow> {
  const uid = (await getSessionUser())?.id;
  if (!uid) throw new Error("You need to be signed in.");
  const { data, error } = await supabase
    .from(INTAKES)
    .upsert(
      {
        user_id: uid,
        workshop_slug: input.slug,
        answers: input.answers,
        ...(input.submit ? { submitted_at: new Date().toISOString() } : {}),
      },
      { onConflict: "user_id,workshop_slug" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as AuditIntakeRow;
}

export async function getMyAudit(slug: string): Promise<AuditRow | null> {
  const uid = (await getSessionUser())?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from(AUDITS)
    .select("*")
    .eq("user_id", uid)
    .eq("workshop_slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as AuditRow) ?? null;
}

/* -------------------------------- admin --------------------------------- */

export async function listIntakes(): Promise<AuditIntakeRow[]> {
  const { data, error } = await supabase
    .from(INTAKES)
    .select("*")
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as AuditIntakeRow[];
}

export async function listAudits(): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from(AUDITS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

/** Ships the lane spec with the request so repo copy stays the source of truth. */
export async function generateAudit(intake: AuditIntakeRow): Promise<AuditRow> {
  const audit = getWorkshopAudit(intake.workshop_slug);
  const workshop = getCatalogWorkshop(intake.workshop_slug);
  if (!audit) throw new Error("That workshop has no audit definition.");

  const { data, error } = await supabase.functions.invoke("workshop-audit-generate", {
    body: {
      intakeId: intake.id,
      spec: {
        workshopTitle: workshop?.title ?? intake.workshop_slug,
        auditName: audit.name,
        promise: audit.promise,
        prescribedOutcome: audit.prescribedOutcome,
        improvement: audit.improvement,
        pains: getWorkshopPains(intake.workshop_slug).map((p) => ({
          id: p.id,
          pain: p.pain,
          fix: p.fix,
        })),
      },
    },
  });
  if (error) throw error;
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { audit: AuditRow }).audit;
}

export async function updateAudit(
  id: string,
  patch: Partial<Pick<AuditRow, "report" | "admin_notes" | "prescribed_outcome" | "overall_grade" | "status">>,
): Promise<AuditRow> {
  const { data, error } = await supabase
    .from(AUDITS)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as AuditRow;
}

/** Approve and release to the attendee in one step. */
export async function sendAudit(id: string): Promise<AuditRow> {
  const now = new Date().toISOString();
  return updateAudit(id, { status: "sent" }).then(async () => {
    const { data, error } = await supabase
      .from(AUDITS)
      .update({ approved_at: now, sent_at: now })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as AuditRow;
  });
}
