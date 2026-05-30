import { motion } from "framer-motion";

const ITEMS = [
  { year: "1985 – 2008", title: "Brand & communications foundation", desc: "Two decades engineering brand infrastructure for North American enterprises, laying the groundwork that would later draw Citigroup, Mayo Clinic, 3M, and Disney as clients." },
  { year: "2009", title: "Founded OPEN Interactive (Orlando)", desc: "Launched OPEN Interactive LLC in Florida. Delivered the Mayo Clinic Experience Center at Mall of America, the 3M HIS Division Experience Center, and the Amway Arena visitor experience." },
  { year: "2014", title: "Relocated to St. Kitts & Nevis", desc: "Co-founded OPEN Interactive Inc. in the Federation and stood up the region's largest public-private technology partnership, working across nearly every government ministry." },
  { year: "2014 – 2021", title: "National digital infrastructure", desc: "Engineered the Federation's central eGovernment portal, the Inland Revenue tax portal, and a child-protective-services case-management system. Branded the national CBI program." },
  { year: "2018 – present", title: "Caribbean Investment Summit", desc: "Co-originated the franchise and served as Executive Producer for CIS18, CIS19, CIS24 (Grenada), CIS25 (Antigua & Barbuda), and CIS26 (Saint Lucia) — five OECS jurisdictions." },
  { year: "2020", title: "Sovereign crisis & soft-power work", desc: "Directed pro-bono COVID-19 crisis communications for the St. Kitts & Nevis Ministry of Health and advised the national pavilion at Expo 2020 Dubai." },
  { year: "2022 – present", title: "AI-native product builder", desc: "Designed and shipped five SaaS platforms — Ampfli, PivotHQ, AskEve, WorkshopAI, and a fifth in stealth — each built with an AI-first toolchain." },
  { year: "2024 – present", title: "Founder & CEO, Institute of AI Professionals", desc: "Building the global standards body for AI practitioners, with founding chapters across North America, Europe, Asia-Pacific, the Middle East, and Africa & the Caribbean." },
];

export function FacilitatorTimeline() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
        Career Milestones
      </p>
      <div className="relative pl-8">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/20" />
        <ul className="space-y-8">
          {ITEMS.map((it) => (
            <li key={it.year} className="relative">
              <span className="absolute -left-8 top-1.5 h-[15px] w-[15px] rounded-full bg-primary" />
              <div className="text-xs uppercase tracking-[0.18em] text-primary mb-1">
                {it.year}
              </div>
              <h3 className="text-xl font-semibold leading-tight tracking-tight text-foreground mb-1.5 md:text-3xl">{it.title}</h3>
              <p className="text-base text-muted-foreground md:text-lg">{it.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
