// Curated industry list for the Founders Hub intake.
// Flattened, searchable. ~150 entries covering common solo-founder / SMB cases
// plus broad NAICS-style buckets. Free-text fallback is allowed in the picker.

export type Industry = {
  /** Stored value, e.g. "Food & Beverage › Café" */
  value: string;
  /** Display label */
  label: string;
  /** Search aliases — typos, novice terms, synonyms */
  aliases?: string[];
  /** Top-level grouping for the picker */
  group: string;
};

export const INDUSTRIES: Industry[] = [
  // Food & Beverage
  { group: "Food & Beverage", value: "Food & Beverage › Café", label: "Café / Coffee shop", aliases: ["coffee", "coffeehouse", "espresso"] },
  { group: "Food & Beverage", value: "Food & Beverage › Restaurant", label: "Restaurant", aliases: ["dining", "eatery"] },
  { group: "Food & Beverage", value: "Food & Beverage › Bakery", label: "Bakery", aliases: ["pastry", "bread"] },
  { group: "Food & Beverage", value: "Food & Beverage › Food truck", label: "Food truck", aliases: ["mobile food"] },
  { group: "Food & Beverage", value: "Food & Beverage › Catering", label: "Catering" },
  { group: "Food & Beverage", value: "Food & Beverage › Brewery", label: "Brewery / Distillery", aliases: ["beer", "distillery", "winery"] },
  { group: "Food & Beverage", value: "Food & Beverage › CPG / Packaged food", label: "Packaged food brand (CPG)", aliases: ["cpg", "consumer packaged"] },
  { group: "Food & Beverage", value: "Food & Beverage › Meal prep / Delivery", label: "Meal prep / Meal delivery" },
  { group: "Food & Beverage", value: "Food & Beverage › Bar / Pub", label: "Bar / Pub / Nightclub" },

  // Retail & Ecommerce
  { group: "Retail & Ecommerce", value: "Retail › DTC ecommerce", label: "DTC ecommerce brand", aliases: ["d2c", "shopify", "online store"] },
  { group: "Retail & Ecommerce", value: "Retail › Apparel & Fashion", label: "Apparel / Fashion brand", aliases: ["clothing", "streetwear"] },
  { group: "Retail & Ecommerce", value: "Retail › Beauty & Personal care", label: "Beauty / Personal care", aliases: ["skincare", "cosmetics", "haircare"] },
  { group: "Retail & Ecommerce", value: "Retail › Home goods", label: "Home goods / Decor" },
  { group: "Retail & Ecommerce", value: "Retail › Jewelry & Accessories", label: "Jewelry / Accessories" },
  { group: "Retail & Ecommerce", value: "Retail › Marketplace", label: "Online marketplace", aliases: ["multi-vendor", "two-sided"] },
  { group: "Retail & Ecommerce", value: "Retail › Subscription box", label: "Subscription box" },
  { group: "Retail & Ecommerce", value: "Retail › Physical store", label: "Brick-and-mortar retail store" },
  { group: "Retail & Ecommerce", value: "Retail › Pet products", label: "Pet products" },

  // Software & SaaS
  { group: "Software & SaaS", value: "Software › B2B SaaS", label: "B2B SaaS", aliases: ["saas", "software"] },
  { group: "Software & SaaS", value: "Software › B2C SaaS / App", label: "B2C SaaS / Consumer app", aliases: ["mobile app", "consumer app"] },
  { group: "Software & SaaS", value: "Software › Developer tools", label: "Developer tools / Devtools", aliases: ["devtools", "api"] },
  { group: "Software & SaaS", value: "Software › AI tooling", label: "AI tools / AI infrastructure", aliases: ["ai", "ml", "machine learning", "llm"] },
  { group: "Software & SaaS", value: "Software › No-code / Low-code", label: "No-code / Low-code platform" },
  { group: "Software & SaaS", value: "Software › Vertical SaaS", label: "Vertical SaaS (industry-specific)" },
  { group: "Software & SaaS", value: "Software › Open source / Infra", label: "Open source / Infrastructure" },
  { group: "Software & SaaS", value: "Software › Cybersecurity", label: "Cybersecurity" },
  { group: "Software & SaaS", value: "Software › Data & Analytics", label: "Data & Analytics platform" },
  { group: "Software & SaaS", value: "Software › Gaming", label: "Gaming / Game studio" },

  // Professional Services
  { group: "Professional Services", value: "Services › Consulting", label: "Consulting", aliases: ["advisor", "consultant"] },
  { group: "Professional Services", value: "Services › Marketing agency", label: "Marketing / Creative agency", aliases: ["seo", "ads", "agency"] },
  { group: "Professional Services", value: "Services › Design studio", label: "Design studio", aliases: ["branding", "ux"] },
  { group: "Professional Services", value: "Services › Software agency", label: "Software / Dev agency" },
  { group: "Professional Services", value: "Services › Accounting & Bookkeeping", label: "Accounting / Bookkeeping" },
  { group: "Professional Services", value: "Services › Legal", label: "Law firm / Legal services" },
  { group: "Professional Services", value: "Services › Coaching", label: "Coaching", aliases: ["life coach", "executive coach"] },
  { group: "Professional Services", value: "Services › Recruiting", label: "Recruiting / Staffing" },
  { group: "Professional Services", value: "Services › PR & Communications", label: "PR / Communications" },
  { group: "Professional Services", value: "Services › Translation", label: "Translation / Localization" },

  // Local Services
  { group: "Local Services", value: "Local › Cleaning", label: "Cleaning services", aliases: ["janitorial", "maid"] },
  { group: "Local Services", value: "Local › Landscaping", label: "Landscaping / Lawn care" },
  { group: "Local Services", value: "Local › Home repair / Handyman", label: "Home repair / Handyman" },
  { group: "Local Services", value: "Local › HVAC", label: "HVAC / Plumbing / Electrical" },
  { group: "Local Services", value: "Local › Auto repair", label: "Auto repair / Detailing" },
  { group: "Local Services", value: "Local › Moving", label: "Moving / Junk removal" },
  { group: "Local Services", value: "Local › Pet services", label: "Pet grooming / Boarding / Walking" },
  { group: "Local Services", value: "Local › Childcare", label: "Childcare / Daycare" },
  { group: "Local Services", value: "Local › Events & Weddings", label: "Event planning / Weddings" },
  { group: "Local Services", value: "Local › Photography", label: "Photography / Videography" },
  { group: "Local Services", value: "Local › Tutoring", label: "Tutoring / Test prep" },
  { group: "Local Services", value: "Local › Fitness studio", label: "Gym / Fitness studio", aliases: ["yoga", "pilates", "crossfit"] },

  // Health & Wellness
  { group: "Health & Wellness", value: "Health › Medical practice", label: "Medical practice / Clinic" },
  { group: "Health & Wellness", value: "Health › Dental", label: "Dental practice" },
  { group: "Health & Wellness", value: "Health › Mental health", label: "Mental health / Therapy" },
  { group: "Health & Wellness", value: "Health › Wellness coaching", label: "Wellness / Nutrition coaching" },
  { group: "Health & Wellness", value: "Health › Spa & Salon", label: "Spa / Salon / Barber" },
  { group: "Health & Wellness", value: "Health › Supplements", label: "Supplements / Nutraceuticals" },
  { group: "Health & Wellness", value: "Health › Digital health", label: "Digital health / Telehealth" },
  { group: "Health & Wellness", value: "Health › Medical devices", label: "Medical devices" },
  { group: "Health & Wellness", value: "Health › Biotech", label: "Biotech / Pharma" },

  // Real Estate & Construction
  { group: "Real Estate & Construction", value: "Real estate › Brokerage", label: "Real estate brokerage / Agent" },
  { group: "Real Estate & Construction", value: "Real estate › Property management", label: "Property management" },
  { group: "Real Estate & Construction", value: "Real estate › Development", label: "Real estate development" },
  { group: "Real Estate & Construction", value: "Real estate › Short-term rentals", label: "Short-term rentals / Airbnb" },
  { group: "Real Estate & Construction", value: "Real estate › PropTech", label: "PropTech software" },
  { group: "Real Estate & Construction", value: "Construction › General contractor", label: "General contractor" },
  { group: "Real Estate & Construction", value: "Construction › Specialty trades", label: "Specialty trades" },
  { group: "Real Estate & Construction", value: "Construction › Architecture", label: "Architecture / Engineering firm" },
  { group: "Real Estate & Construction", value: "Construction › Interior design", label: "Interior design" },

  // Finance & Insurance
  { group: "Finance & Insurance", value: "Finance › Fintech", label: "Fintech", aliases: ["payments", "neobank"] },
  { group: "Finance & Insurance", value: "Finance › Wealth management", label: "Wealth / Financial advisor" },
  { group: "Finance & Insurance", value: "Finance › Insurance brokerage", label: "Insurance brokerage" },
  { group: "Finance & Insurance", value: "Finance › Insurtech", label: "Insurtech" },
  { group: "Finance & Insurance", value: "Finance › Lending", label: "Lending / Mortgage" },
  { group: "Finance & Insurance", value: "Finance › Crypto / Web3", label: "Crypto / Web3", aliases: ["blockchain", "defi"] },
  { group: "Finance & Insurance", value: "Finance › Tax services", label: "Tax preparation / Services" },

  // Media & Creator
  { group: "Media & Creator", value: "Media › Newsletter", label: "Newsletter / Publication", aliases: ["substack", "beehiiv"] },
  { group: "Media & Creator", value: "Media › Podcast", label: "Podcast" },
  { group: "Media & Creator", value: "Media › Creator / Influencer", label: "Creator / Influencer business" },
  { group: "Media & Creator", value: "Media › Online course", label: "Online course / Education product", aliases: ["edtech", "course"] },
  { group: "Media & Creator", value: "Media › Community / Membership", label: "Community / Membership" },
  { group: "Media & Creator", value: "Media › Film & Production", label: "Film / Video production" },
  { group: "Media & Creator", value: "Media › Music label / Artist", label: "Music label / Artist services" },
  { group: "Media & Creator", value: "Media › Publishing", label: "Book / Magazine publishing" },

  // Education
  { group: "Education", value: "Education › K-12 school", label: "K-12 school / Program" },
  { group: "Education", value: "Education › Higher ed", label: "Higher education / Bootcamp" },
  { group: "Education", value: "Education › EdTech", label: "EdTech software" },
  { group: "Education", value: "Education › Test prep", label: "Test prep / Tutoring service" },
  { group: "Education", value: "Education › Corporate training", label: "Corporate training / L&D" },

  // Travel & Hospitality
  { group: "Travel & Hospitality", value: "Travel › Hotel / B&B", label: "Hotel / Boutique inn / B&B" },
  { group: "Travel & Hospitality", value: "Travel › Tour operator", label: "Tour operator / Guide" },
  { group: "Travel & Hospitality", value: "Travel › Travel agency", label: "Travel agency" },
  { group: "Travel & Hospitality", value: "Travel › Travel tech", label: "Travel tech / Booking platform" },

  // Industrial & Manufacturing
  { group: "Industrial & Manufacturing", value: "Industrial › Manufacturing", label: "Manufacturing" },
  { group: "Industrial & Manufacturing", value: "Industrial › Logistics", label: "Logistics / Freight / 3PL" },
  { group: "Industrial & Manufacturing", value: "Industrial › Wholesale & Distribution", label: "Wholesale / Distribution" },
  { group: "Industrial & Manufacturing", value: "Industrial › Industrial supplies", label: "Industrial supplies / B2B equipment" },
  { group: "Industrial & Manufacturing", value: "Industrial › Robotics & Hardware", label: "Robotics / Hardware startup" },
  { group: "Industrial & Manufacturing", value: "Industrial › 3D printing", label: "3D printing / Additive manufacturing" },

  // Energy & Sustainability
  { group: "Energy & Sustainability", value: "Energy › Solar / Renewables", label: "Solar / Renewable energy" },
  { group: "Energy & Sustainability", value: "Energy › Climate tech", label: "Climate tech" },
  { group: "Energy & Sustainability", value: "Energy › Utilities", label: "Utilities" },
  { group: "Energy & Sustainability", value: "Energy › Sustainable / Circular goods", label: "Sustainable / Circular products" },
  { group: "Energy & Sustainability", value: "Energy › EV / Mobility", label: "EV / Mobility" },

  // Agriculture
  { group: "Agriculture", value: "Agriculture › Farm / Ranch", label: "Farm / Ranch" },
  { group: "Agriculture", value: "Agriculture › AgTech", label: "AgTech software / Hardware" },
  { group: "Agriculture", value: "Agriculture › Cannabis", label: "Cannabis / Hemp" },

  // Nonprofit & Public
  { group: "Nonprofit & Public", value: "Nonprofit › Charity / NGO", label: "Nonprofit / Charity" },
  { group: "Nonprofit & Public", value: "Nonprofit › Social enterprise", label: "Social enterprise" },
  { group: "Nonprofit & Public", value: "Nonprofit › Religious organization", label: "Religious organization" },
  { group: "Nonprofit & Public", value: "Government", label: "Government / Public sector" },

  // Catch-all
  { group: "Other", value: "Other", label: "Other (describe below)" },
];

/** Simple fuzzy match used by the IndustryCombobox. */
export function searchIndustries(query: string, limit = 30): Industry[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDUSTRIES.slice(0, limit);
  const scored: { item: Industry; score: number }[] = [];
  for (const it of INDUSTRIES) {
    const hay = `${it.label} ${it.value} ${(it.aliases ?? []).join(" ")}`.toLowerCase();
    if (!hay.includes(q)) continue;
    // Earlier match scores higher; exact alias match wins
    const score = (it.aliases ?? []).includes(q) ? 0 : hay.indexOf(q);
    scored.push({ item: it, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.item);
}
