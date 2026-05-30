import { motion } from "framer-motion";
import { Zap, Building2, Mic2, Code2, type LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: "Founders compressing the build", desc: "From validated idea to live product without waiting for a team or a Series A — using the same AI stack Adam ships with." },
  { icon: Building2, title: "Executives leading adoption", desc: "Practical decision frameworks for rolling AI into an organization — minus the vendor pitch and the hype cycle." },
  { icon: Mic2, title: "Brand & marketing operators", desc: "Authority engines and content systems engineered to compound in a feed flooded with machine-written sameness." },
  { icon: Code2, title: "Engineers becoming founders", desc: "Crossing from technical builder to commercial operator — pricing, positioning, and shipping product, not just code." },
];

export function FacilitatorAudience() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
        These workshops are built for
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6">
            <Icon className="text-primary mb-3" size={22} />
            <h3 className="text-lg font-semibold capitalize tracking-tight text-card-foreground mb-2">{title}</h3>
            <p className="text-sm leading-[1.7] text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
