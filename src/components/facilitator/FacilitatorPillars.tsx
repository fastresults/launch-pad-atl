import { motion } from "framer-motion";
import { Brain, Rocket, Megaphone, Globe, Shuffle, Users, type LucideIcon } from "lucide-react";

const PILLARS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Brain, title: "Practitioner-first AI fluency", desc: "Adam uses AI daily to build, ship, and operate. Every tactic he teaches is live in production." },
  { icon: Rocket, title: "Startup velocity frameworks", desc: "From ideation to validated product — methodologies built across real ventures, not hypotheticals." },
  { icon: Megaphone, title: "Personal brand authority", desc: "Four decades of brand infrastructure work distilled into a voice-led system for the AI era." },
  { icon: Globe, title: "Global business perspective", desc: "Strategy shaped by work with Fortune 500s, sovereign governments, and Caribbean economic institutions." },
  { icon: Shuffle, title: "Real-time transformation lens", desc: "Not a retrospective on what worked in 2019 — a live read on what's shifting right now." },
  { icon: Users, title: "Executive-caliber delivery", desc: "A facilitator who has presented to heads of state and C-suites. No wasted words in the room." },
];

export function FacilitatorPillars() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-4">
        What he brings to the room
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PILLARS.map(({ icon: Icon, title, desc }) => (
          <motion.div
            key={title}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgb(0 0 0 / 0.25)" }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <Icon className="text-primary mb-4" size={24} />
            <h3 className="font-display font-bold text-lg text-card-foreground mb-2">{title}</h3>
            <p className="font-body text-sm leading-[1.7] text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
