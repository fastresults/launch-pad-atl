import { motion } from "framer-motion";

const STATS = [
  { n: "18 yrs", l: "Leading OPEN Interactive" },
  { n: "4", l: "Fortune 500 experience centers" },
  { n: "5", l: "Caribbean Investment Summits produced" },
  { n: "7 yrs", l: "Embedded with a sovereign government" },
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
