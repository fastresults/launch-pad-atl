import { motion } from "framer-motion";
import { Zap, Building2, Mic2, Code2, type LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: "Entrepreneurs & startup founders", desc: "Ready to compress the startup timeline using AI — from idea validation to launch without a full team." },
  { icon: Building2, title: "Executives & corporate leaders", desc: "Navigating AI adoption inside an organization and needing a practical, strategic framework — not a vendor pitch." },
  { icon: Mic2, title: "Brand & marketing professionals", desc: "Building personal authority and content systems that survive — and thrive — in an AI-saturated landscape." },
  { icon: Code2, title: "Tech professionals & developers", desc: "Expanding from builder to founder — using AI tools to ship products faster and position their expertise commercially." },
];

export function FacilitatorAudience() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-6">
        These workshops are built for
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6">
            <Icon className="text-primary mb-3" size={22} />
            <h3 className="font-display font-bold text-lg text-card-foreground mb-2">{title}</h3>
            <p className="font-body text-sm leading-[1.7] text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
