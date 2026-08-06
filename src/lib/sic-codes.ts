// SIC (Standard Industrial Classification) catalog used by the industry picker.
// Compact tuple form: [code, title, division]. Codes are the common 4-digit
// industry codes founders actually land in, grouped by SIC division.
//
// Stored value format: "SIC 5812 — Eating Places" (see `sicValue`).

export type SicEntry = {
  code: string;
  title: string;
  division: string;
  aliases?: string[];
};

type Row = [code: string, title: string, aliases?: string];

const DIVISIONS: { division: string; rows: Row[] }[] = [
  {
    division: "Agriculture, Forestry & Fishing",
    rows: [
      ["0100", "Agricultural Production — Crops", "farm, farming, produce, growing"],
      ["0200", "Agricultural Production — Livestock", "ranch, cattle, poultry, dairy"],
      ["0700", "Agricultural Services", "landscaping, crop services, veterinary support"],
      ["0781", "Landscape Counseling & Planning", "landscape design"],
      ["0782", "Lawn & Garden Services", "lawn care, mowing, landscaping"],
      ["0800", "Forestry", "timber, logging"],
      ["0900", "Fishing, Hunting & Trapping", "fishery, aquaculture"],
    ],
  },
  {
    division: "Mining",
    rows: [
      ["1000", "Metal Mining", "mining"],
      ["1300", "Oil & Gas Extraction", "oil, gas, energy extraction"],
      ["1400", "Mining & Quarrying of Nonmetallic Minerals", "quarry, gravel"],
    ],
  },
  {
    division: "Construction",
    rows: [
      ["1521", "General Contractors — Single-Family Houses", "home builder, custom homes"],
      ["1531", "Operative Builders", "spec homes, developer"],
      ["1540", "General Contractors — Nonresidential", "commercial construction"],
      ["1611", "Highway & Street Construction", "paving, asphalt"],
      ["1711", "Plumbing, Heating & Air-Conditioning", "hvac, plumber, ac repair, boiler"],
      ["1721", "Painting & Paper Hanging", "painter, house painting"],
      ["1731", "Electrical Work", "electrician, wiring, ev charger install"],
      ["1741", "Masonry & Stonework", "brick, concrete, hardscape"],
      ["1742", "Plastering, Drywall & Insulation", "drywall, insulation"],
      ["1751", "Carpentry Work", "carpenter, trim, framing"],
      ["1752", "Floor Laying & Floor Work", "flooring, tile, hardwood"],
      ["1761", "Roofing, Siding & Sheet Metal Work", "roofer, roofing, gutters"],
      ["1771", "Concrete Work", "concrete, driveway"],
      ["1794", "Excavation Work", "excavating, grading"],
      ["1799", "Special Trade Contractors, NEC", "handyman, fencing, pools"],
    ],
  },
  {
    division: "Manufacturing",
    rows: [
      ["2000", "Food & Kindred Products", "food manufacturing, cpg, packaged food"],
      ["2024", "Ice Cream & Frozen Desserts", "gelato, frozen yogurt"],
      ["2051", "Bread, Cake & Related Products", "bakery production, commercial bakery"],
      ["2080", "Beverages", "beverage, drinks, soda"],
      ["2082", "Malt Beverages", "brewery, craft beer"],
      ["2084", "Wines, Brandy & Brandy Spirits", "winery"],
      ["2085", "Distilled & Blended Liquors", "distillery, spirits"],
      ["2086", "Bottled & Canned Soft Drinks", "kombucha, seltzer, energy drink"],
      ["2095", "Roasted Coffee", "coffee roaster"],
      ["2300", "Apparel & Other Finished Products", "clothing manufacturing, cut and sew"],
      ["2320", "Men's & Boys' Furnishings", "menswear"],
      ["2330", "Women's, Misses' & Juniors' Outerwear", "womenswear"],
      ["2390", "Fabricated Textile Products, NEC", "textiles, home textiles"],
      ["2400", "Lumber & Wood Products", "millwork, woodworking"],
      ["2500", "Furniture & Fixtures", "furniture maker"],
      ["2700", "Printing & Publishing", "print shop, publisher"],
      ["2752", "Commercial Printing — Lithographic", "printing, signage printing"],
      ["2800", "Chemicals & Allied Products", "chemicals"],
      ["2844", "Toilet Preparations", "skincare, cosmetics, beauty products, haircare"],
      ["3000", "Rubber & Miscellaneous Plastics", "plastics"],
      ["3089", "Plastics Products, NEC", "injection molding, 3d printing"],
      ["3400", "Fabricated Metal Products", "metal fabrication, welding"],
      ["3500", "Industrial & Commercial Machinery", "machinery, equipment manufacturing"],
      ["3571", "Electronic Computers", "hardware, computers"],
      ["3600", "Electronic & Other Electrical Equipment", "electronics"],
      ["3674", "Semiconductors & Related Devices", "chips, semiconductor"],
      ["3711", "Motor Vehicles & Passenger Car Bodies", "automotive manufacturing, ev"],
      ["3841", "Surgical & Medical Instruments", "medical device"],
      ["3845", "Electromedical Apparatus", "medical hardware, diagnostics device"],
      ["3911", "Jewelry, Precious Metal", "jewelry maker"],
      ["3944", "Games, Toys & Children's Vehicles", "toys, games"],
      ["3949", "Sporting & Athletic Goods", "sporting goods, fitness equipment"],
      ["3990", "Manufacturing Industries, NEC", "maker, artisan goods"],
    ],
  },
  {
    division: "Transportation & Utilities",
    rows: [
      ["4119", "Local Passenger Transportation, NEC", "shuttle, black car, medical transport"],
      ["4121", "Taxicabs", "rideshare, taxi"],
      ["4212", "Local Trucking Without Storage", "hauling, junk removal, courier"],
      ["4213", "Trucking, Except Local", "freight, long haul, owner operator"],
      ["4214", "Local Trucking With Storage", "moving company, movers"],
      ["4225", "General Warehousing & Storage", "warehouse, 3pl, self storage"],
      ["4400", "Water Transportation", "boat, marine, charter"],
      ["4500", "Transportation by Air", "airline, charter flights, drone services"],
      ["4724", "Travel Agencies", "travel agent, trip planning"],
      ["4731", "Freight Transportation Arrangement", "freight broker, logistics broker"],
      ["4813", "Telephone Communications", "telecom, voip"],
      ["4832", "Radio Broadcasting", "podcast network, radio"],
      ["4833", "Television Broadcasting", "tv, streaming channel"],
      ["4841", "Cable & Other Pay Television", "streaming service"],
      ["4899", "Communications Services, NEC", "internet service, satellite"],
      ["4911", "Electric Services", "solar, renewable energy, utility"],
      ["4959", "Sanitary Services, NEC", "waste, recycling, environmental services"],
    ],
  },
  {
    division: "Wholesale Trade",
    rows: [
      ["5000", "Wholesale — Durable Goods", "distributor, wholesale"],
      ["5045", "Computers & Peripherals Wholesale", "it reseller, hardware reseller"],
      ["5065", "Electronic Parts & Equipment Wholesale", "components"],
      ["5122", "Drugs & Druggists' Sundries Wholesale", "supplements distribution"],
      ["5140", "Groceries & Related Products Wholesale", "food distribution"],
      ["5180", "Beer, Wine & Distilled Beverages Wholesale", "beverage distribution"],
      ["5190", "Wholesale — Nondurable Goods, NEC", "wholesale goods"],
    ],
  },
  {
    division: "Retail Trade",
    rows: [
      ["5211", "Lumber & Building Materials Dealers", "hardware store"],
      ["5261", "Retail Nurseries & Garden Stores", "plant shop, garden center"],
      ["5311", "Department Stores", "general retail"],
      ["5411", "Grocery Stores", "market, bodega, corner store"],
      ["5451", "Dairy Products Stores", "creamery"],
      ["5461", "Retail Bakeries", "bakery, cake shop, cookies"],
      ["5499", "Miscellaneous Food Stores", "specialty food, health food store"],
      ["5511", "Motor Vehicle Dealers — New & Used", "car dealer"],
      ["5531", "Auto & Home Supply Stores", "auto parts"],
      ["5541", "Gasoline Service Stations", "gas station, convenience"],
      ["5611", "Men's & Boys' Clothing Stores", "menswear retail"],
      ["5621", "Women's Clothing Stores", "boutique, womenswear retail"],
      ["5641", "Children's & Infants' Wear Stores", "kids clothing"],
      ["5651", "Family Clothing Stores", "apparel retail, streetwear"],
      ["5661", "Shoe Stores", "sneakers, footwear"],
      ["5699", "Miscellaneous Apparel & Accessory Stores", "accessories, hats"],
      ["5712", "Furniture Stores", "home furniture"],
      ["5719", "Miscellaneous Home Furnishings Stores", "home goods, decor"],
      ["5734", "Computer & Software Stores", "computer store"],
      ["5735", "Record & Prerecorded Tape Stores", "vinyl, music store"],
      ["5812", "Eating Places", "restaurant, cafe, coffee shop, food truck, ghost kitchen, bar food, catering"],
      ["5813", "Drinking Places", "bar, pub, nightclub, cocktail lounge, taproom"],
      ["5912", "Drug Stores & Proprietary Stores", "pharmacy"],
      ["5921", "Liquor Stores", "bottle shop, wine shop"],
      ["5941", "Sporting Goods & Bicycle Shops", "bike shop, outdoor gear"],
      ["5942", "Book Stores", "bookstore"],
      ["5944", "Jewelry Stores", "jewelry retail"],
      ["5945", "Hobby, Toy & Game Shops", "toys, games retail"],
      ["5947", "Gift, Novelty & Souvenir Shops", "gift shop, candles, stationery"],
      ["5961", "Catalog & Mail-Order Houses", "ecommerce, dtc, online store, shopify, subscription box, marketplace seller"],
      ["5963", "Direct Selling Establishments", "pop-up, farmers market, vending"],
      ["5992", "Florists", "flowers, floral design"],
      ["5995", "Optical Goods Stores", "eyewear"],
      ["5999", "Retail Stores, NEC", "pet products, specialty retail, art"],
    ],
  },
  {
    division: "Finance, Insurance & Real Estate",
    rows: [
      ["6021", "National Commercial Banks", "bank"],
      ["6141", "Personal Credit Institutions", "lending, consumer loans, bnpl"],
      ["6153", "Short-Term Business Credit", "business lending, invoice factoring"],
      ["6199", "Finance Services, NEC", "fintech, payments, neobank, crypto"],
      ["6282", "Investment Advice", "financial advisor, wealth management, ria"],
      ["6311", "Life Insurance", "life insurance agent"],
      ["6411", "Insurance Agents, Brokers & Service", "insurance agency, broker"],
      ["6512", "Operators of Nonresidential Buildings", "commercial landlord"],
      ["6513", "Operators of Apartment Buildings", "rental property, multifamily"],
      ["6531", "Real Estate Agents & Managers", "realtor, brokerage, property management, str, airbnb"],
      ["6552", "Land Subdividers & Developers", "real estate development"],
    ],
  },
  {
    division: "Services",
    rows: [
      ["7011", "Hotels & Motels", "hotel, bnb, short term rental, boutique hotel"],
      ["7211", "Power Laundries & Dry Cleaning", "laundry, dry cleaner, wash and fold"],
      ["7221", "Photographic Studios, Portrait", "photographer, photography, headshots"],
      ["7231", "Beauty Shops", "salon, hair stylist, barber, nails, lashes, esthetician, med spa"],
      ["7241", "Barber Shops", "barber, grooming"],
      ["7261", "Funeral Service & Crematories", "funeral home"],
      ["7291", "Tax Return Preparation Services", "tax prep, tax preparer"],
      ["7299", "Miscellaneous Personal Services", "personal concierge, life coach, matchmaking"],
      ["7311", "Advertising Agencies", "marketing agency, ad agency, growth agency, social media agency"],
      ["7319", "Advertising, NEC", "influencer marketing, creator, media buying"],
      ["7322", "Adjustment & Collection Services", "collections, ar recovery"],
      ["7331", "Direct Mail Advertising Services", "email marketing, direct mail, crm services"],
      ["7336", "Commercial Art & Graphic Design", "graphic design, brand design, illustration, ux design"],
      ["7338", "Secretarial & Court Reporting", "virtual assistant, transcription"],
      ["7342", "Disinfecting & Pest Control", "pest control, exterminator"],
      ["7349", "Building Cleaning & Maintenance", "cleaning company, janitorial, house cleaning, pressure washing"],
      ["7359", "Equipment Rental & Leasing, NEC", "rentals, party rental, tool rental"],
      ["7361", "Employment Agencies", "recruiting, staffing, headhunter, talent"],
      ["7363", "Help Supply Services", "temp staffing, contract labor"],
      ["7371", "Computer Programming & Custom Software", "software development, app development, dev shop, custom software"],
      ["7372", "Prepackaged Software", "saas, b2b saas, ai software, mobile app, developer tools, platform"],
      ["7373", "Computer Integrated Systems Design", "systems integrator, automation, ai implementation"],
      ["7374", "Data Processing & Preparation", "data services, analytics, data platform"],
      ["7375", "Information Retrieval Services", "search, data marketplace, api service"],
      ["7376", "Computer Facilities Management", "managed it, msp"],
      ["7379", "Computer Related Services, NEC", "it support, tech consulting, cybersecurity"],
      ["7381", "Detective & Armored Car Services", "security services, private investigator"],
      ["7382", "Security Systems Services", "alarm install, cameras, smart home security"],
      ["7389", "Business Services, NEC", "bookkeeping services, translation, event production, notary, fulfillment, consulting"],
      ["7513", "Truck Rental & Leasing", "truck rental, fleet leasing"],
      ["7514", "Passenger Car Rental", "car rental, turo fleet"],
      ["7532", "Top, Body & Upholstery Repair", "body shop, auto repair, collision"],
      ["7538", "General Automotive Repair Shops", "mechanic, auto shop, mobile mechanic"],
      ["7542", "Carwashes", "car wash, auto detailing, mobile detailing"],
      ["7629", "Electrical Repair Shops", "device repair, phone repair, appliance repair"],
      ["7699", "Repair Shops & Related Services, NEC", "equipment repair, small engine repair"],
      ["7812", "Motion Picture & Video Production", "video production, videography, film, content studio"],
      ["7819", "Services Allied to Motion Picture Production", "post production, editing, animation"],
      ["7929", "Entertainers & Entertainment Groups", "dj, band, performer, entertainment"],
      ["7933", "Bowling Centers", "bowling, entertainment venue"],
      ["7941", "Professional Sports Clubs & Promoters", "sports team, league, events"],
      ["7991", "Physical Fitness Facilities", "gym, fitness studio, yoga, pilates, crossfit"],
      ["7992", "Public Golf Courses", "golf, simulator"],
      ["7997", "Membership Sports & Recreation Clubs", "club, membership, racquet, pickleball"],
      ["7999", "Amusement & Recreation Services, NEC", "personal training, tours, adventure, escape room, event experience"],
      ["8011", "Offices & Clinics of Medical Doctors", "medical practice, clinic, telehealth, concierge medicine"],
      ["8021", "Offices & Clinics of Dentists", "dentist, orthodontist"],
      ["8031", "Offices of Osteopathic Physicians", "osteopath"],
      ["8041", "Offices & Clinics of Chiropractors", "chiropractor"],
      ["8042", "Offices & Clinics of Optometrists", "optometry, eye care"],
      ["8049", "Offices of Health Practitioners, NEC", "physical therapy, acupuncture, nutritionist, dietitian, massage therapy"],
      ["8051", "Skilled Nursing Care Facilities", "nursing home, senior care facility"],
      ["8059", "Nursing & Personal Care, NEC", "assisted living, group home"],
      ["8082", "Home Health Care Services", "home health, caregiving, in-home care"],
      ["8093", "Specialty Outpatient Facilities, NEC", "behavioral health, therapy practice, counseling, mental health, iv therapy"],
      ["8111", "Legal Services", "law firm, attorney, lawyer, paralegal services"],
      ["8200", "Educational Services", "school, education, academy"],
      ["8299", "Schools & Educational Services, NEC", "tutoring, online course, coaching program, bootcamp, edtech, test prep, driving school"],
      ["8322", "Individual & Family Social Services", "nonprofit services, community programs"],
      ["8351", "Child Day Care Services", "daycare, preschool, childcare, after school"],
      ["8399", "Social Services, NEC", "charity, ngo, social enterprise, foundation"],
      ["8641", "Civic & Social Associations", "association, membership org, community group"],
      ["8661", "Religious Organizations", "church, ministry, faith organization"],
      ["8711", "Engineering Services", "engineering firm, civil engineering, mep"],
      ["8712", "Architectural Services", "architect, architecture firm"],
      ["8721", "Accounting, Auditing & Bookkeeping", "accountant, cpa, bookkeeper, fractional cfo, payroll"],
      ["8731", "Commercial Physical & Biological Research", "biotech, r&d, lab, life sciences"],
      ["8732", "Commercial Nonphysical Research", "market research, survey, insights"],
      ["8742", "Management Consulting Services", "consultant, business consulting, operations consulting, fractional exec"],
      ["8743", "Public Relations Services", "pr firm, publicity, communications"],
      ["8748", "Business Consulting Services, NEC", "sales consulting, ai consulting, strategy"],
      ["8999", "Services, NEC", "freelance, creator business, writer, coach, other services"],
    ],
  },
  {
    division: "Public Administration",
    rows: [
      ["9199", "General Government, NEC", "government, public sector"],
      ["9441", "Administration of Social & Human Resources", "public programs"],
      ["9511", "Air, Water & Solid Waste Management", "environmental agency"],
    ],
  },
];

export const SIC_CODES: SicEntry[] = DIVISIONS.flatMap(({ division, rows }) =>
  rows.map(([code, title, aliases]) => ({
    code,
    title,
    division,
    aliases: aliases ? aliases.split(",").map((a) => a.trim()).filter(Boolean) : undefined,
  })),
);

/** Canonical stored value for a SIC entry: "SIC 5812 — Eating Places". */
export function sicValue(entry: SicEntry): string {
  return `SIC ${entry.code} — ${entry.title}`;
}

/** Parse a stored value back into its code, if it is a SIC value. */
export function parseSicCode(value: string): string | null {
  const m = /^SIC\s+(\d{4})\b/.exec(value.trim());
  return m ? m[1] : null;
}

export function findSicByCode(code: string): SicEntry | undefined {
  return SIC_CODES.find((e) => e.code === code);
}

/** Keyword search over code, title, division and aliases. */
export function searchSic(query: string, limit = 40): SicEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SIC_CODES.slice(0, limit);
  const terms = q.split(/\s+/).filter(Boolean);
  const scored: { item: SicEntry; score: number }[] = [];
  for (const it of SIC_CODES) {
    const title = it.title.toLowerCase();
    const aliases = (it.aliases ?? []).join(" ").toLowerCase();
    const hay = `${it.code} ${title} ${it.division.toLowerCase()} ${aliases}`;
    if (!terms.every((t) => hay.includes(t))) continue;
    let score = 100;
    if (it.code.startsWith(q)) score = 0;
    else if (title.startsWith(q)) score = 5;
    else if ((it.aliases ?? []).some((a) => a.toLowerCase() === q)) score = 8;
    else if ((it.aliases ?? []).some((a) => a.toLowerCase().startsWith(q))) score = 12;
    else score = 20 + hay.indexOf(terms[0]);
    scored.push({ item: it, score });
  }
  scored.sort((a, b) => a.score - b.score || a.item.code.localeCompare(b.item.code));
  return scored.slice(0, limit).map((s) => s.item);
}
