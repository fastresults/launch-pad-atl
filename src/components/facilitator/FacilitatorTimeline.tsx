import { motion } from "framer-motion";

const ITEMS = [
  { year: "1985 – 2008", title: "Fortune 500 brand & communications", desc: "40-year career building brand infrastructure, communications systems, and identity programs for some of North America's largest organizations, including Citigroup." },
  { year: "2009", title: "Co-founded OPEN Interactive", desc: "Full-service digital agency and event production company. First client: Citigroup. Now operating globally with Pathways PR as its communications division." },
  { year: "2014 – 2020", title: "Sovereign technology partner, St. Kitts & Nevis", desc: "Built eGovernment infrastructure, the national IRS portal, and CBI branding for the federal government. Originated the Caribbean Investment Summit." },
  { year: "2022 – present", title: "AI-native product builder", desc: "Launched and actively ships five SaaS platforms including Ampfli, PivotHQ, AskEve, and WorkshopAI — all built with AI-first toolchains." },
  { year: "2024 – present", title: "Founder & CEO, Institute of AI Professionals", desc: "Building the global standards body for AI practitioners, with five founding chapters across North America, Europe, Asia-Pacific, the Middle East, and Africa & the Caribbean." },
];

export function FacilitatorTimeline() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6">
        Career Milestones
      </p>
      <div className="relative pl-8">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/20" />
        <ul className="space-y-8">
          {ITEMS.map((it) => (
            <li key={it.year} className="relative">
              <span className="absolute -left-8 top-1.5 h-[15px] w-[15px] rounded-full bg-primary" />
              <div className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-1">
                {it.year}
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-1.5">{it.title}</h3>
              <p className="font-body text-base leading-[1.8] text-muted-foreground">{it.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
