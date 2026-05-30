import { motion } from "framer-motion";
import { Brain, Rocket, Megaphone, Globe, Shuffle, Users, type LucideIcon } from "lucide-react";

const PILLARS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Brain, title: "Practitioner-first AI fluency", desc: "Nothing taught in the room is theoretical. Every prompt, pattern, and workflow is one Adam ran in production this week." },
  { icon: Rocket, title: "Compressed time-to-launch", desc: "Frameworks pulled from shipping five AI-native SaaS products solo — the same playbook that turns weeks of build into days." },
  { icon: Megaphone, title: "Narrative that compounds", desc: "Brand systems engineered to gain authority over time, not chase the algorithm — drawn from four decades of Fortune 500 and sovereign storytelling." },
  { icon: Globe, title: "Global operating range", desc: "Strategy stress-tested with Citigroup boardrooms, OECS heads of government, and the St. Kitts–Nevis pavilion at Expo 2020 Dubai." },
  { icon: Shuffle, title: "Real-time transformation lens", desc: "Not a retrospective on what worked in 2019. A live read on what the frontier looks like the week you walk into the room." },
  { icon: Users, title: "Executive-caliber delivery", desc: "A facilitator who has briefed prime ministers, CMOs, and conference mainstages. No wasted words, no filler slides." },
];

export function FacilitatorPillars() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
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
            <h3 className="text-lg font-semibold tracking-tight text-card-foreground mb-2">{title}</h3>
            <p className="text-sm leading-[1.7] text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
