// @ts-nocheck
// Build a hub.new prefill from the canonical founder context.
// Previously this re-queried tables and regex-guessed industry; now it just
// reads from `getCanonicalFounderContext` so what the founder typed in the
// Brief / MarketBlock / Profile flows straight through.
import { getCanonicalFounderContext } from "@/lib/canonical-context";

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
  track: string;
};

function archetypeToTrack(archetype: string): string {
  const a = (archetype || "").toLowerCase();
  if (a.includes("main") || a.includes("local") || a.includes("brick")) return "lifestyle";
  if (a.includes("ecommerce") || a.includes("dtc") || a.includes("brand")) return "ecommerce";
  if (a.includes("service") || a.includes("agency") || a.includes("consult")) return "service";
  if (a.includes("saas") || a.includes("software") || a.includes("tech")) return "saas";
  if (a.includes("creator") || a.includes("media") || a.includes("content")) return "creator";
  return "lifestyle";
}

export async function buildPrefillFromBrief(): Promise<SnapshotPrefill | null> {
  const ctx = await getCanonicalFounderContext();
  if (!ctx) return null;

  return {
    fromBrief: true,
    company_name: ctx.concept.company_name,
    business_concept: ctx.concept.business_concept_blob,
    differentiation_statement: ctx.concept.differentiation,
    founder_name: ctx.identity.full_name,
    founder_email: ctx.identity.email,
    founder_phone: ctx.identity.phone,
    city: ctx.market.city,
    region: ctx.market.region,
    country: ctx.market.country || "United States",
    market_scope: (ctx.market.market_scope || "local") as SnapshotPrefill["market_scope"],
    industry: ctx.market.industry,
    sub_industry: ctx.market.sub_industry,
    track: archetypeToTrack(ctx.market.archetype),
  };
}
