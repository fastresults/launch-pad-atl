import { motion } from "framer-motion";

const STATS = [
  { n: "40+", l: "Years in brand & comms" },
  { n: "5+", l: "SaaS products built with AI" },
  { n: "3", l: "Active ventures led today" },
  { n: "2", l: "Continents of government work" },
];

export function FacilitatorStats() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-6"
    >
      {STATS.map((s) => (
        <div key={s.l} className="border-t border-border pt-4">
          <div className="font-display font-black text-[40px] leading-none text-foreground">{s.n}</div>
          <div className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mt-3">
            {s.l}
          </div>
        </div>
      ))}
    </motion.section>
  );
}
