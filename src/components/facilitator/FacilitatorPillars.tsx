import { motion } from "framer-motion";
import { Brain, Rocket, Megaphone, Globe, Shuffle, Users, type LucideIcon } from "lucide-react";

const PILLARS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Brain, title: "Practitioner-first AI fluency", desc: "Nothing taught in the room is theoretical. Every prompt, pattern, and workflow is one Adam ran in production this week — and he uses them in the room to actually build your startup, not to explain how it could be built." },
  { icon: Rocket, title: "Compressed time-to-launch", desc: "Hands pulled from shipping five AI-native SaaS products solo — the same operator hands that turn weeks of build into a morning, live in the room with you." },
  { icon: Megaphone, title: "Narrative that compounds", desc: "Brand and messaging built with you on the spot — voice, positioning, first page copy — drawn from four decades of Fortune 500 and sovereign storytelling. You leave with the copy in your site, not slides about it." },
  { icon: Globe, title: "Global operating range", desc: "Judgment stress-tested with Citigroup boardrooms, OECS heads of government, and the St. Kitts–Nevis pavilion at Expo 2020 Dubai — brought to bear on the actual pricing, page, and first move we ship for your startup." },
  { icon: Shuffle, title: "Real-time build lens", desc: "Not a retrospective on what worked in 2019. A live read on what the frontier looks like the week you walk into the room — applied directly to what we're building for you that morning." },
  { icon: Users, title: "Executive-caliber delivery", desc: "A facilitator who has briefed prime ministers, CMOs, and conference mainstages — sitting at your table, doing the work with you, not lecturing at you." },
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
