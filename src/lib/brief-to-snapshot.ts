// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type SnapshotPrefill = {
  fromBrief: true;
  company_name: string;
  business_concept: string;
  differentiation_statement: string;
  founder_name: string;
  founder_email: string;
  founder_phone: string;
  city: string;
  region: string;
  country: string;
  market_scope: "local" | "regional" | "national" | "international";
  industry: string;
  sub_industry: string;
  track: string; // TrackKey, but kept loose to avoid import cycles
};

function trimOrEmpty(v?: string | null) {
  return (v ?? "").toString().trim();
}

function deriveCompanyName(pitch: string): string {
  const cleaned = trimOrEmpty(pitch).replace(/^["'`]+|["'`]+$/g, "");
  if (!cleaned) return "";
  // Take the part before the first em-dash, hyphen-with-space, colon, or period
  const seg = cleaned.split(/[—\-:.]\s|[—:]/)[0].trim();
  const words = seg.split(/\s+/).slice(0, 5).join(" ");
  return words.length > 60 ? words.slice(0, 60) : words;
}

function guessIndustryFromText(text: string): string {
  const c = text.toLowerCase();
  if (/\b(bank|payment|fintech|invoic|payroll|ledger|treasury|card)\b/.test(c)) return "Financial Services";
  if (/\b(developer|api|sdk|devtool|deploy|infrastructure|database|observability)\b/.test(c)) return "Developer Tools";
  if (/\b(ai|llm|model|agent|machine learning|gpt)\b/.test(c)) return "Artificial Intelligence";
  if (/\b(shop|store|ecommerce|e-commerce|retail|merchandise)\b/.test(c)) return "E-commerce & Retail";
  if (/\b(marketing|seo|crm|sales|outreach|campaign|newsletter)\b/.test(c)) return "Marketing & Sales";
  if (/\b(health|clinic|patient|medical|wellness|therapy)\b/.test(c)) return "Healthcare";
  if (/\b(school|learn|education|course|tutor|student)\b/.test(c)) return "Education";
  if (/\b(notes|productivity|workflow|collaborat|task|project management)\b/.test(c)) return "Productivity Software";
  if (/\b(cafe|coffee|restaurant|bakery|salon|barber|boutique|trade|local service)\b/.test(c)) return "Local Services";
  return "";
}

export async function buildPrefillFromBrief(): Promise<SnapshotPrefill | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  // Brief row
  const { data: brief } = await supabase
    .from("attendee_business_brief")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Optional attendee profile (business_name, industry, full_name)
  let attendeeProfile: any = null;
  try {
    const { data } = await supabase
      .from("attendee_profiles")
      .select("full_name,business_name,industry")
      .eq("user_id", user.id)
      .maybeSingle();
    attendeeProfile = data;
  } catch {
    attendeeProfile = null;
  }

  // Public profile (display_name, email)
  let pubProfile: any = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("display_name,email")
      .eq("user_id", user.id)
      .maybeSingle();
    pubProfile = data;
  } catch {
    pubProfile = null;
  }

  const meta: any = user.user_metadata ?? {};
  const pitch = trimOrEmpty(brief?.one_line_pitch);
  const problem = trimOrEmpty(brief?.problem_statement);
  const offer = trimOrEmpty(brief?.offer_description);
  const target = trimOrEmpty(brief?.target_customer);
  const unique = trimOrEmpty(brief?.unique_insight);

  const conceptParts = [
    pitch && `What we're building: ${pitch}`,
    problem && `Problem we're solving: ${problem}`,
    offer && `What we offer: ${offer}`,
    target && `Who it's for: ${target}`,
  ].filter(Boolean);

  const business_concept = conceptParts.join("\n\n");
  const company_name =
    trimOrEmpty(attendeeProfile?.business_name) || deriveCompanyName(pitch);

  const fullName =
    trimOrEmpty(attendeeProfile?.full_name) ||
    trimOrEmpty(pubProfile?.display_name) ||
    trimOrEmpty(meta.display_name) ||
    trimOrEmpty(meta.name) ||
    trimOrEmpty(meta.full_name);

  const guessed = guessIndustryFromText(`${pitch} ${offer} ${problem}`);

  return {
    fromBrief: true,
    company_name,
    business_concept,
    differentiation_statement: unique,
    founder_name: fullName,
    founder_email: trimOrEmpty(user.email) || trimOrEmpty(pubProfile?.email),
    founder_phone: trimOrEmpty(meta.phone),
    city: "",
    region: "",
    country: "United States",
    market_scope: "local",
    industry: trimOrEmpty(attendeeProfile?.industry) || guessed,
    sub_industry: "",
    track: "lifestyle", // Main Street default
  };
}
